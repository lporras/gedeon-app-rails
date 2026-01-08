// Load all the controllers within this directory and all subdirectories.
// Controller files must be named *_controller.js or *_controller.ts.

import { Application } from '@hotwired/stimulus';

// Start the Stimulus application
const application = Application.start();

// Import and register all controllers here
import LetterNavController from "./letter_nav_controller";
import ThemeController from "./theme_controller";
import InstallBannerController from "./install_banner_controller";
import ChordproPreviewController from "./chordpro_preview_controller";
import TabsController from "./tabs_controller"

// Configure Stimulus development experience
application.debug = process.env.NODE_ENV === 'development';

// Register controllers
application.register("letter-nav", LetterNavController);
application.register("theme", ThemeController);
application.register("install-banner", InstallBannerController);
application.register("chordpro-preview", ChordproPreviewController);
application.register("tabs", TabsController);

export default application;
