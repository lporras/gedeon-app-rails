import { Application } from '@hotwired/stimulus';

console.log('Initializing Stimulus application...');
const application = Application.start();

// Configure Stimulus development experience
application.debug = process.env.NODE_ENV === 'development';

// Debug: Log registered controllers
if (application.debug) {
  application.handleError = (error, message, detail) => {
    console.error('Stimulus Error:', { error, message, detail });
  };

  application.logDebugActivity = (identifier, functionName, args) => {
    console.log('Stimulus Debug:', { identifier, functionName, args });
  };
}

export default application;
