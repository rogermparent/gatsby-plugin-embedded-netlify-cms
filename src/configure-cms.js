export default ({CMS, config}) => {
  // If running in development
  if (process.env.NODE_ENV === 'development') {
    const FileSystemBackend = require('netlify-cms-backend-fs')
    // Register the FileSystemBackend.
    config.backend = {
      name: 'file-system',
      api_root: 'http://localhost:8000/api'
    };

    config.display_url = 'http://localhost:8000';
    CMS.registerBackend('file-system', FileSystemBackend);
  }
}
