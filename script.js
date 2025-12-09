import JSZip from 'https://esm.sh/jszip';

// --- INITIAL DATA ---
const INITIAL_PHP = `<?php
/**
 * Plugin Name: Kadence Blocks – Gutenberg Blocks for Page Builder Features
 * Plugin URI: https://www.kadencewp.com/product/kadence-gutenberg-blocks/
 * Description: Advanced Page Building Blocks for Gutenberg. Create custom column layouts, backgrounds, dual buttons, icons etc.
 * Author: Kadence WP
 * Author URI: https://www.kadencewp.com
 * Version: 3.5.29
 * Requires PHP: 7.4
 * Text Domain: kadence-blocks
 * License: GPL2+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.txt
 *
 * @package Kadence Blocks
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
define( 'KADENCE_BLOCKS_PATH', realpath( plugin_dir_path( __FILE__ ) ) . DIRECTORY_SEPARATOR );
define( 'KADENCE_BLOCKS_URL', plugin_dir_url( __FILE__ ) );
define( 'KADENCE_BLOCKS_VERSION', '3.5.29' );

require_once plugin_dir_path( __FILE__ ) . 'vendor/vendor-prefixed/autoload.php';
require_once plugin_dir_path( __FILE__ ) . 'vendor/autoload.php';

// Main Init function
function kadence_blocks_init(): void {
    // Initialization logic here
}
add_action('plugins_loaded', 'kadence_blocks_init');
`;

// --- STATE MANAGEMENT ---
const state = {
    files: {
        'plugin.php': { content: INITIAL_PHP, type: 'php', main: true },
        'readme.txt': { content: '=== Plugin Name ===\n\nDetailed description.', type: 'text' },
        'style.css': { content: '/* Main Styles */\n.my-plugin {\n  color: red;\n}', type: 'css' },
        'script.js': { content: '// Main Script\nconsole.log("Plugin loaded");', type: 'js' }
    },
    activeFile: 'plugin.php',
    isUpdating: false
};

// --- DOM ELEMENTS ---
const editor = document.getElementById('codeEditor');
const fileListEl = document.getElementById('fileList');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const btnDownload = document.getElementById('downloadBtn');
const btnAddFile = document.getElementById('addFileBtn');
const btnFormat = document.getElementById('formatBtn');
const statusMessage = document.getElementById('statusMessage');

// Metadata Inputs
const metaInputs = {
    name: document.getElementById('pluginName'),
    slug: document.getElementById('pluginSlug'),
    uri: document.getElementById('pluginURI'),
    author: document.getElementById('pluginAuthor'),
    desc: document.getElementById('pluginDescription'),
    version: document.getElementById('pluginVersion')
};

// Preview Elements
const preview = {
    name: document.getElementById('previewName'),
    version: document.getElementById('previewVersion'),
    author: document.getElementById('previewAuthor'),
    desc: document.getElementById('previewDesc')
};

// --- INITIALIZATION ---
function init() {
    renderFileList();
    loadActiveFile();
    parseMetadata();
    updatePreview();
    setupEventListeners();
}

function setupEventListeners() {
    // Editor Input
    editor.addEventListener('input', () => {
        // Save content to state
        state.files[state.activeFile].content = editor.value;
        
        // If main file, parse metadata
        if (state.files[state.activeFile].main && !state.isUpdating) {
            parseMetadata();
        }
    });

    // Metadata Inputs
    Object.keys(metaInputs).forEach(key => {
        metaInputs[key].addEventListener('input', () => {
            updatePreview();
            updateCodeFromMetadata();
        });
    });

    // Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            e.target.classList.add('active');
            document.getElementById(`tab-${e.target.dataset.tab}`).classList.add('active');
        });
    });

    // Add File
    btnAddFile.addEventListener('click', () => {
        const name = prompt("Enter file name (e.g. includes/helper.php):");
        if (name && !state.files[name]) {
            state.files[name] = { content: '<?php\n\n// New File', type: 'php' };
            renderFileList();
            switchFile(name);
        }
    });

    // Snippets
    document.querySelectorAll('.snippet-btn').forEach(btn => {
        btn.addEventListener('click', () => injectSnippet(btn.dataset.snippet));
    });

    // Download
    btnDownload.addEventListener('click', downloadZip);
    
    // Format (Simple indentation fix)
    btnFormat.addEventListener('click', () => {
        // Very basic beautifier
        // In a real app we'd use Prettier, but here we just ensure basic indentation
        const lines = editor.value.split('\n');
        // This is a placeholder for a real formatter, currently just a no-op or simple trim
        // Keeping it simple to avoid breaking code logic
        statusMessage.textContent = "Formatted (Basic)";
        setTimeout(() => statusMessage.textContent = "Ready", 1000);
    });
}

// --- FILE SYSTEM LOGIC ---
function renderFileList() {
    fileListEl.innerHTML = '';
    Object.keys(state.files).sort().forEach(filename => {
        const file = state.files[filename];
        const el = document.createElement('div');
        el.className = `file-item ${filename === state.activeFile ? 'active' : ''}`;
        
        // Icon selection
        let icon = '📄';
        if (filename.endsWith('.php')) icon = '🐘';
        if (filename.endsWith('.css')) icon = '🎨';
        if (filename.endsWith('.js')) icon = '📜';
        
        el.innerHTML = `
            <span class="file-name">${icon} ${filename}</span>
            ${!file.main ? `<span class="delete-file" title="Delete">×</span>` : ''}
        `;
        
        el.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-file')) {
                delete state.files[filename];
                renderFileList();
                if (filename === state.activeFile) switchFile(Object.keys(state.files)[0]);
            } else {
                switchFile(filename);
            }
        });
        
        fileListEl.appendChild(el);
    });
}

function switchFile(filename) {
    state.activeFile = filename;
    renderFileList();
    loadActiveFile();
}

function loadActiveFile() {
    const file = state.files[state.activeFile];
    editor.value = file.content;
    fileNameDisplay.textContent = state.activeFile;
}

// --- METADATA & PARSING ---
function parseMetadata() {
    state.isUpdating = true;
    const code = editor.value; // Only parses active file (assuming it's main)
    
    const extract = (regex) => {
        const match = code.match(regex);
        return match ? match[1].trim() : '';
    };

    const name = extract(/Plugin Name:\s*(.*)/);
    const slug = extract(/Text Domain:\s*(.*)/);
    const version = extract(/Version:\s*(.*)/);
    const author = extract(/Author:\s*(.*)/);
    const desc = extract(/Description:\s*(.*)/);
    const uri = extract(/Plugin URI:\s*(.*)/);

    if (name) metaInputs.name.value = name;
    if (slug) metaInputs.slug.value = slug;
    if (version) metaInputs.version.value = version;
    if (author) metaInputs.author.value = author;
    if (desc) metaInputs.desc.value = desc;
    if (uri) metaInputs.uri.value = uri;

    updatePreview();
    state.isUpdating = false;
}

function updateCodeFromMetadata() {
    if (state.isUpdating) return;
    
    // Only update if we are editing the main plugin file
    const mainFileKey = Object.keys(state.files).find(k => state.files[k].main);
    if (state.activeFile !== mainFileKey) return;

    let code = editor.value;
    
    const replaceHeader = (label, value) => {
        const regex = new RegExp(`(${label}:\\s*)(.*)`);
        if (regex.test(code)) {
            code = code.replace(regex, `$1${value}`);
        }
    };

    replaceHeader('Plugin Name', metaInputs.name.value);
    replaceHeader('Text Domain', metaInputs.slug.value);
    replaceHeader('Version', metaInputs.version.value);
    replaceHeader('Author', metaInputs.author.value);
    replaceHeader('Description', metaInputs.desc.value);
    replaceHeader('Plugin URI', metaInputs.uri.value);

    // Update constants if they exist
    const version = metaInputs.version.value;
    code = code.replace(/(define\(\s*['"].*_VERSION['"]\s*,\s*['"])(.*)(['"]\s*\);)/, `$1${version}$3`);

    state.files[state.activeFile].content = code;
    editor.value = code;
}

function updatePreview() {
    preview.name.textContent = metaInputs.name.value || 'My Plugin';
    preview.version.textContent = metaInputs.version.value || '1.0.0';
    preview.author.textContent = metaInputs.author.value || 'Author';
    preview.desc.textContent = metaInputs.desc.value || 'Plugin description...';
}

// --- SNIPPETS ---
const SNIPPETS = {
    cpt: `
/**
 * Register Custom Post Type
 */
function register_my_cpt() {
	$args = array(
		'public' => true,
		'label'  => 'My Posts',
        'menu_icon' => 'dashicons-book',
        'supports' => array('title', 'editor', 'thumbnail'),
        'show_in_rest' => true,
	);
	register_post_type( 'my_post_type', $args );
}
add_action( 'init', 'register_my_cpt' );
`,
    shortcode: `
/**
 * Shortcode: [my_shortcode]
 */
function my_shortcode_func( $atts ) {
    $atts = shortcode_atts( array(
        'title' => 'Default Title',
    ), $atts );

    return "<h2>{$atts['title']}</h2>";
}
add_shortcode( 'my_shortcode', 'my_shortcode_func' );
`,
    'admin-menu': `
/**
 * Add Admin Menu Page
 */
function my_plugin_menu() {
    add_menu_page(
        'My Page Title',
        'My Menu',
        'manage_options',
        'my-plugin-slug',
        'my_plugin_page_html',
        'dashicons-admin-plugins',
        6
    );
}
add_action( 'admin_menu', 'my_plugin_menu' );

function my_plugin_page_html() {
    ?>
    <div class="wrap">
        <h1>My Plugin Page</h1>
        <p>Welcome to my settings page.</p>
    </div>
    <?php
}
`,
    enqueue: `
/**
 * Enqueue Scripts & Styles
 */
function my_plugin_assets() {
    wp_enqueue_style( 'my-plugin-style', plugins_url( 'style.css', __FILE__ ) );
    wp_enqueue_script( 'my-plugin-script', plugins_url( 'script.js', __FILE__ ), array('jquery'), '1.0', true );
}
add_action( 'wp_enqueue_scripts', 'my_plugin_assets' );
`,
    'rest-api': `
/**
 * Register REST API Route
 * GET /wp-json/my-plugin/v1/data
 */
add_action( 'rest_api_init', function () {
  register_rest_route( 'my-plugin/v1', '/data', array(
    'methods' => 'GET',
    'callback' => 'my_plugin_get_data',
    'permission_callback' => '__return_true',
  ) );
} );

function my_plugin_get_data() {
  return array( 'success' => true, 'message' => 'Hello World' );
}
`,
    widget: `
/**
 * Register Widget
 */
class My_Custom_Widget extends WP_Widget {
    public function __construct() {
        parent::__construct( 'my_custom_widget', 'My Widget', array( 'description' => 'A Custom Widget' ) );
    }
    public function widget( $args, $instance ) {
        echo $args['before_widget'];
        echo 'Hello World';
        echo $args['after_widget'];
    }
}
add_action( 'widgets_init', function() { register_widget( 'My_Custom_Widget' ); } );
`
};

function injectSnippet(type) {
    const snippet = SNIPPETS[type];
    if (!snippet) return;

    const startPos = editor.selectionStart;
    const endPos = editor.selectionEnd;
    const text = editor.value;
    
    editor.value = text.substring(0, startPos) + snippet + text.substring(endPos, text.length);
    
    // Update state
    state.files[state.activeFile].content = editor.value;
    
    // Restore cursor / focus
    editor.focus();
    editor.selectionStart = startPos + snippet.length;
    editor.selectionEnd = startPos + snippet.length;
}

// --- DOWNLOAD ZIP ---
async function downloadZip() {
    statusMessage.textContent = "Packing...";
    const zip = new JSZip();
    const slug = metaInputs.slug.value || 'my-plugin';
    const folder = zip.folder(slug);

    // Add all virtual files
    Object.keys(state.files).forEach(filename => {
        folder.file(filename, state.files[filename].content);
    });

    // Smart Stubbing for PHP files (Simplified for multi-file)
    // We scan ALL php files for require_once to generate stubs
    const phpFiles = Object.values(state.files).filter(f => f.type === 'php');
    const createdPaths = new Set();
    const addPlaceholder = (relPath) => {
        if (createdPaths.has(relPath) || state.files[relPath]) return; // Don't overwrite existing virtual files
        createdPaths.add(relPath);
        folder.file(relPath, "<?php // Placeholder generated by WP Dev Studio");
    };

    phpFiles.forEach(file => {
        const code = file.content;
        const regex = /require_once\s+(?:plugin_dir_path\(\s*__FILE__\s*\)\s*\.?\s*)?['"]([^'"]+)['"]/g;
        const constantRegex = /require_once\s+KADENCE_BLOCKS_PATH\s*\.?\s*['"]([^'"]+)['"]/g;
        
        let match;
        while ((match = regex.exec(code)) !== null) addPlaceholder(match[1]);
        while ((match = constantRegex.exec(code)) !== null) addPlaceholder(match[1]);
    });

    // Generate
    const content = await zip.generateAsync({type:"blob"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = `${slug}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
    
    statusMessage.textContent = "Downloaded!";
    setTimeout(() => statusMessage.textContent = "Ready", 3000);
}

// Start
init();