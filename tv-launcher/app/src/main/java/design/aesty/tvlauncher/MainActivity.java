package design.aesty.tvlauncher;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A minimal, remote-friendly home screen for Android TV / Google TV (built with Sony Bravia in mind).
 *
 * Layout: greeting + clock, then three rows — Favourites (user-pinned, reorderable), Apps (every
 * launchable app, as a wrapping grid) and System shortcuts. Long-press OK (or press MENU) on any
 * app for options.
 */
public class MainActivity extends Activity {

    private static final int COLUMNS = 6;
    private static final String PREFS = "launcher";
    private static final String KEY_FAVOURITES = "favourites";

    /** Packages that open live TV / inputs on Sony and stock Android TV, tried in order. */
    private static final String[] TV_PACKAGES = {
            "com.sony.dtv.tvx",              // Sony "TV" (tuner + HDMI inputs)
            "com.google.android.tv",         // Live Channels
            "com.android.tv",
    };

    private final List<AppEntry> apps = new ArrayList<>();
    private LinearLayout rowsView;
    private ScrollView scrollView;
    private TextView greetingView;
    private SharedPreferences prefs;
    private String lastFocusedKey;
    private int tileWidthPx;
    private int tileHeightPx;
    private int gapPx;

    private final BroadcastReceiver packageReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            reload();
        }
    };

    // ---------------------------------------------------------------------------------- lifecycle

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        rowsView = findViewById(R.id.rows);
        scrollView = findViewById(R.id.scroll);
        greetingView = findViewById(R.id.greeting);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);

        computeTileSize();

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_PACKAGE_ADDED);
        filter.addAction(Intent.ACTION_PACKAGE_REMOVED);
        filter.addAction(Intent.ACTION_PACKAGE_CHANGED);
        filter.addAction(Intent.ACTION_PACKAGE_REPLACED);
        filter.addDataScheme("package");
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(packageReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(packageReceiver, filter);
        }

        reload();
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateGreeting();
    }

    @Override
    protected void onDestroy() {
        unregisterReceiver(packageReceiver);
        super.onDestroy();
    }

    /** Pressing HOME while already home jumps back to the top. */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (Intent.ACTION_MAIN.equals(intent.getAction())) {
            scrollView.smoothScrollTo(0, 0);
            focusFirstTile();
        }
    }

    /** We are the home screen: BACK has nowhere to go. */
    @Override
    public void onBackPressed() {
        scrollView.smoothScrollTo(0, 0);
        focusFirstTile();
    }

    // ---------------------------------------------------------------------------------- data

    private void reload() {
        loadApps();
        buildRows();
    }

    private void loadApps() {
        PackageManager pm = getPackageManager();
        Map<String, AppEntry> byPackage = new LinkedHashMap<>();

        // TV-optimised apps first: they have proper 16:9 banners.
        addLaunchables(pm, Intent.CATEGORY_LEANBACK_LAUNCHER, byPackage, true);
        addLaunchables(pm, Intent.CATEGORY_LAUNCHER, byPackage, false);

        byPackage.remove(getPackageName());

        apps.clear();
        apps.addAll(byPackage.values());
        Collections.sort(apps, (a, b) -> a.label.compareToIgnoreCase(b.label));
    }

    private void addLaunchables(PackageManager pm, String category, Map<String, AppEntry> out,
                                boolean leanback) {
        Intent query = new Intent(Intent.ACTION_MAIN).addCategory(category);
        List<ResolveInfo> results = pm.queryIntentActivities(query, 0);
        for (ResolveInfo ri : results) {
            String pkg = ri.activityInfo.packageName;
            if (out.containsKey(pkg)) continue;
            Intent launch = new Intent(Intent.ACTION_MAIN)
                    .addCategory(category)
                    .setClassName(pkg, ri.activityInfo.name)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                            | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
            Drawable banner = leanback ? ri.activityInfo.loadBanner(pm) : null;
            if (banner == null && leanback) banner = ri.activityInfo.applicationInfo.loadBanner(pm);
            out.put(pkg, new AppEntry(
                    pkg,
                    String.valueOf(ri.loadLabel(pm)),
                    ri.loadIcon(pm),
                    banner,
                    launch));
        }
    }

    private List<String> getFavourites() {
        String raw = prefs.getString(KEY_FAVOURITES, "");
        List<String> list = new ArrayList<>();
        if (!TextUtils.isEmpty(raw)) list.addAll(Arrays.asList(raw.split(",")));
        return list;
    }

    private void saveFavourites(List<String> favourites) {
        prefs.edit().putString(KEY_FAVOURITES, TextUtils.join(",", favourites)).apply();
    }

    private AppEntry findApp(String pkg) {
        for (AppEntry a : apps) if (a.packageName.equals(pkg)) return a;
        return null;
    }

    // ---------------------------------------------------------------------------------- UI

    private void computeTileSize() {
        int screenW = getResources().getDisplayMetrics().widthPixels;
        int sidePadding = dp(48) * 2;
        gapPx = dp(18);
        tileWidthPx = (screenW - sidePadding - gapPx * (COLUMNS - 1)) / COLUMNS;
        tileHeightPx = tileWidthPx * 9 / 16;
    }

    private void updateGreeting() {
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        String g = hour < 5 ? "Good night" : hour < 12 ? "Good morning"
                : hour < 18 ? "Good afternoon" : "Good evening";
        greetingView.setText(g);
    }

    private void buildRows() {
        View focused = getCurrentFocus();
        if (focused != null && focused.getTag() instanceof String) {
            lastFocusedKey = (String) focused.getTag();
        }
        rowsView.removeAllViews();

        // Favourites ------------------------------------------------------------
        List<AppEntry> favs = new ArrayList<>();
        List<String> favPkgs = getFavourites();
        for (String pkg : favPkgs) {
            AppEntry a = findApp(pkg);
            if (a != null) favs.add(a);
        }
        addRowTitle(getString(R.string.favourites));
        if (favs.isEmpty()) {
            TextView hint = new TextView(this);
            hint.setText(R.string.favourites_hint);
            hint.setTextColor(getColor(R.color.text_secondary));
            hint.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
            hint.setPadding(0, dp(4), 0, dp(20));
            rowsView.addView(hint);
        } else {
            HorizontalScrollView hsv = new HorizontalScrollView(this);
            hsv.setHorizontalScrollBarEnabled(false);
            hsv.setClipChildren(false);
            hsv.setClipToPadding(false);
            LinearLayout row = newRow();
            for (AppEntry a : favs) row.addView(appTile(a, "fav:" + a.packageName, true));
            hsv.addView(row);
            rowsView.addView(hsv);
        }

        // All apps (wrapping grid) ----------------------------------------------
        addRowTitle(getString(R.string.apps));
        LinearLayout row = null;
        for (int i = 0; i < apps.size(); i++) {
            if (i % COLUMNS == 0) {
                row = newRow();
                rowsView.addView(row);
            }
            AppEntry a = apps.get(i);
            row.addView(appTile(a, "app:" + a.packageName, false));
        }

        // System ------------------------------------------------------------------
        addRowTitle(getString(R.string.system));
        LinearLayout sys = newRow();
        Intent tv = findTvIntent();
        if (tv != null) {
            sys.addView(shortcutTile("sys:tv", getString(R.string.inputs),
                    getDrawable(R.drawable.ic_input), tv));
        }
        sys.addView(shortcutTile("sys:settings", getString(R.string.settings),
                getDrawable(R.drawable.ic_settings), new Intent(Settings.ACTION_SETTINGS)));
        sys.addView(shortcutTile("sys:network", getString(R.string.network),
                getDrawable(R.drawable.ic_network), new Intent(Settings.ACTION_WIFI_SETTINGS)));
        rowsView.addView(sys);

        // Restore focus -------------------------------------------------------------
        rowsView.post(() -> {
            View target = lastFocusedKey == null ? null : rowsView.findViewWithTag(lastFocusedKey);
            if (target != null) target.requestFocus();
            else focusFirstTile();
        });
    }

    private Intent findTvIntent() {
        PackageManager pm = getPackageManager();
        for (String pkg : TV_PACKAGES) {
            Intent i = pm.getLeanbackLaunchIntentForPackage(pkg);
            if (i == null) i = pm.getLaunchIntentForPackage(pkg);
            if (i != null) return i;
        }
        return null;
    }

    private void focusFirstTile() {
        View first = findFirstFocusable(rowsView);
        if (first != null) first.requestFocus();
    }

    private View findFirstFocusable(ViewGroup group) {
        for (int i = 0; i < group.getChildCount(); i++) {
            View c = group.getChildAt(i);
            if (c.isFocusable() && c.getTag() != null) return c;
            if (c instanceof ViewGroup) {
                View f = findFirstFocusable((ViewGroup) c);
                if (f != null) return f;
            }
        }
        return null;
    }

    private void addRowTitle(String title) {
        TextView tv = new TextView(this);
        tv.setText(title.toUpperCase());
        tv.setTextColor(getColor(R.color.accent));
        tv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        tv.setLetterSpacing(0.2f);
        tv.setPadding(0, dp(14), 0, dp(10));
        rowsView.addView(tv);
    }

    private LinearLayout newRow() {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setClipChildren(false);
        row.setClipToPadding(false);
        row.setPadding(0, 0, 0, dp(6));
        return row;
    }

    private View appTile(AppEntry app, String key, boolean inFavourites) {
        View tile = baseTile(key, app.label, app.banner, app.icon);
        tile.setOnClickListener(v -> launch(app.launchIntent));
        tile.setOnLongClickListener(v -> {
            showOptions(app, inFavourites);
            return true;
        });
        tile.setOnKeyListener((v, keyCode, event) -> {
            if (keyCode == KeyEvent.KEYCODE_MENU && event.getAction() == KeyEvent.ACTION_UP) {
                showOptions(app, inFavourites);
                return true;
            }
            return false;
        });
        return tile;
    }

    private View shortcutTile(String key, String label, Drawable icon, Intent intent) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        View tile = baseTile(key, label, null, icon);
        tile.setOnClickListener(v -> launch(intent));
        return tile;
    }

    /**
     * A tile is a vertical column: a 16:9 card (banner, or icon on a dark card) with the label
     * below. The column takes focus; the card grows and gets a gold ring.
     */
    private View baseTile(String key, String label, Drawable banner, Drawable icon) {
        LinearLayout column = new LinearLayout(this);
        column.setOrientation(LinearLayout.VERTICAL);
        column.setFocusable(true);
        column.setClickable(true);
        column.setTag(key);
        column.setClipChildren(false);
        LinearLayout.LayoutParams colLp =
                new LinearLayout.LayoutParams(tileWidthPx, ViewGroup.LayoutParams.WRAP_CONTENT);
        colLp.setMarginEnd(gapPx);
        column.setLayoutParams(colLp);

        FrameLayout card = new FrameLayout(this);
        card.setBackgroundResource(R.drawable.tile_bg);
        card.setForeground(getDrawable(R.drawable.tile_focus));
        card.setDuplicateParentStateEnabled(true);
        card.setClipToOutline(true);
        column.addView(card, new LinearLayout.LayoutParams(tileWidthPx, tileHeightPx));

        ImageView image = new ImageView(this);
        if (banner != null) {
            image.setImageDrawable(banner);
            image.setScaleType(ImageView.ScaleType.CENTER_CROP);
            card.addView(image, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        } else {
            image.setImageDrawable(icon);
            image.setScaleType(ImageView.ScaleType.FIT_CENTER);
            int s = tileHeightPx / 2;
            card.addView(image, new FrameLayout.LayoutParams(s, s, Gravity.CENTER));
        }

        TextView text = new TextView(this);
        text.setText(label);
        text.setSingleLine(true);
        text.setEllipsize(TextUtils.TruncateAt.END);
        text.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        text.setTextColor(getColor(R.color.text_secondary));
        text.setPadding(dp(2), dp(8), dp(2), dp(4));
        column.addView(text);

        column.setOnFocusChangeListener((v, hasFocus) -> {
            float scale = hasFocus ? 1.08f : 1f;
            card.animate().scaleX(scale).scaleY(scale).setDuration(140).start();
            card.setElevation(hasFocus ? dp(12) : 0);
            text.setTextColor(getColor(hasFocus ? R.color.text_primary : R.color.text_secondary));
            if (hasFocus) lastFocusedKey = key;
        });
        return column;
    }

    private void launch(Intent intent) {
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException | SecurityException e) {
            Toast.makeText(this, R.string.cannot_open, Toast.LENGTH_SHORT).show();
        }
    }

    private void showOptions(AppEntry app, boolean inFavourites) {
        List<String> favs = getFavourites();
        boolean isFav = favs.contains(app.packageName);
        int index = favs.indexOf(app.packageName);

        List<String> labels = new ArrayList<>();
        List<Runnable> actions = new ArrayList<>();

        labels.add(getString(isFav ? R.string.remove_favourite : R.string.add_favourite));
        actions.add(() -> {
            if (isFav) favs.remove(app.packageName);
            else favs.add(app.packageName);
            saveFavourites(favs);
            buildRows();
        });

        if (inFavourites && index > 0) {
            labels.add(getString(R.string.move_left));
            actions.add(() -> {
                Collections.swap(favs, index, index - 1);
                saveFavourites(favs);
                buildRows();
            });
        }
        if (inFavourites && index >= 0 && index < favs.size() - 1) {
            labels.add(getString(R.string.move_right));
            actions.add(() -> {
                Collections.swap(favs, index, index + 1);
                saveFavourites(favs);
                buildRows();
            });
        }

        labels.add(getString(R.string.app_info));
        actions.add(() -> launch(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.fromParts("package", app.packageName, null))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)));

        new AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                .setTitle(app.label)
                .setItems(labels.toArray(new String[0]), (d, which) -> actions.get(which).run())
                .show();
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    // ---------------------------------------------------------------------------------- model

    static final class AppEntry {
        final String packageName;
        final String label;
        final Drawable icon;
        final Drawable banner;
        final Intent launchIntent;

        AppEntry(String packageName, String label, Drawable icon, Drawable banner, Intent launch) {
            this.packageName = packageName;
            this.label = label;
            this.icon = icon;
            this.banner = banner;
            this.launchIntent = launch;
        }
    }
}
