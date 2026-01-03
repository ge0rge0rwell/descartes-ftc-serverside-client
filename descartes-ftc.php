<?php
/**
 * Plugin Name: Descartes FTC AI
 * Description: An AI-powered chat assistant for FTC (FIRST Tech Challenge), featuring kural kitabı search and a PDF viewer.
 * Version: 1.0.0
 * Author: Oğuzhan Acar
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class DescartesFTC
{
    public function __construct()
    {
        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('wp_footer', [$this, 'render_root_div']);
        add_action('admin_notices', [$this, 'check_build_assets']);
    }

    public function enqueue_assets()
    {
        $plugin_dir = plugin_dir_path(__FILE__);
        $plugin_url = plugin_dir_url(__FILE__);

        $js_file = 'dist/assets/index.js';
        $css_file = 'dist/assets/index.css';

        if (file_exists($plugin_dir . $js_file)) {
            wp_enqueue_script('descartes-ftc-js', $plugin_url . $js_file, [], '1.0.0', true);

            // Pass the plugin URL to JS so it can find assets
            wp_localize_script('descartes-ftc-js', 'descartesConfig', [
                'pluginUrl' => $plugin_url,
                'pdfUrl' => $plugin_url . 'public/game-manual.pdf'
            ]);
        }

        if (file_exists($plugin_dir . $css_file)) {
            wp_enqueue_style('descartes-ftc-css', $plugin_url . $css_file, [], '1.0.0');
        }
    }

    public function check_build_assets()
    {
        $plugin_dir = plugin_dir_path(__FILE__);
        if (!file_exists($plugin_dir . 'dist/assets/index.js')) {
            echo '<div class="notice notice-warning is-dismissible">
                <p><strong>Descartes FTC AI:</strong> Build assets not found. Please make sure to run <code>npm run build</code> and upload the <code>dist</code> folder.</p>
            </div>';
        }
    }

    public function render_root_div()
    {
        echo '<div id="root"></div>';
    }
}

new DescartesFTC();
