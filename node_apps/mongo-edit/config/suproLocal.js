{
  // Example of an external config file
  // See lib/config.js for the explanation of all parameters
  // Note that the first line is a '{' because Mongo Edit will crash if the config file begins with a comment
  // Regex don't work well and I don't want to include a js-parser just for that
  db: { host: '127.0.0.1'
      , port: 27727
      , name: 'supro_GLOB'
      }
, svPort: 2764
, trustProxy: false
, templatesDir: 'templates'
, pagination: { resultsPerPage: 100, pagesAroundCurrent: 2 }
, baseUrl: ''
}
