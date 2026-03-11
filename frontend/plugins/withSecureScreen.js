const { withMainActivity } = require('expo/config-plugins');

/**
 * An Expo Config Plugin to enforce WindowManager.LayoutParams.FLAG_SECURE
 * on the root Android host. 
 * 
 * Crucial for Indian Fintech: This fundamentally blocks OS-level screen recorders,
 * remote casting tools, and rogue accessibility overlays from capturing the 
 * React Native JS thread output (UPI PINs, Private Keys, etc).
 */
const withSecureScreen = (config) => {
    return withMainActivity(config, async (config) => {
        const mainActivity = config.modResults.contents;

        // Import WindowManager if not present
        let newContents = mainActivity;
        if (!newContents.includes('android.view.WindowManager')) {
            newContents = newContents.replace(
                /import android.os.Bundle;/,
                'import android.os.Bundle;\nimport android.view.WindowManager;'
            );
        }

        // Inject FLAG_SECURE right after super.onCreate(null)
        const secureFlagCode = `
    // V3 Anti-Fraud Mesh: Blind OS-Level Overlays and Screenshots
    getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
    `;

        if (!newContents.includes('FLAG_SECURE')) {
            newContents = newContents.replace(
                /(super\.onCreate\(null\);)/,
                `$1\n${secureFlagCode}`
            );
        }

        config.modResults.contents = newContents;
        return config;
    });
};

module.exports = withSecureScreen;
