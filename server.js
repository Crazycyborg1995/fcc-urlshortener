'use strict';

var express = require('express');
var mongoose = require('mongoose');
const dns = require('dns');
const bodyParser = require('body-parser');
var cors = require('cors');
var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;
let env = process.env.NODE_ENV || 'development';

if (env === 'development') {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/urlshortener';
  console.log('Logged in.........');
} else if (env === 'production') {
  process.env.MONGODB_URI =
    'mongodb+srv://afsal:tG4gAAzGEGGXQ4Yk@test-bxj9a.mongodb.net/test?retryWrites=true';
}

/** this project needs a db !! **/
mongoose.Promise = global.Promise;
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true
  })
  .then(() => console.log('connected on mongodb server'))
  .catch(err => console.log(err));

app.use(cors());

// Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST) and exposes the resulting object (containing the keys and values) on req.body
app.use(bodyParser.urlencoded({ extended: true }));
//Parses the text as JSON and exposes the resulting object on req.body.
app.use(bodyParser.json());
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

// Create Schema
let UrlSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true
  },
  id: Number
});

// Create a model
let Url = mongoose.model('Url', UrlSchema);

// GET '/' Route
// ==========================
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// POST '/new' Route
// ==========================
app.post('/api/shorturl/new', async (req, res) => {
  let url = req.body.url;
  let validateUrl = url.replace(/^https?:\/\//i, '');
  let id = await Url.find()
    .then(docs => docs.length)
    .catch(err => null);

  // validate url
  dns.lookup(validateUrl, err => {
    if (err !== null) {
      res.status(400).json({ error: 'invalid url' });
    } else {
      // create new instance of url
      let newUrl = new Url({
        url,
        id
      });
      newUrl
        .save()
        .then(url => {
          if (url) {
            return res.status(200).send({ url, id });
          }
          res.status(401).json({ error: 'Something went wrong' });
        })
        .catch(err => res.status(401).json({ error: 'Something went wrong' }));
    }
  });
});

// GET '/:id' Route
// ==========================
app.get('/api/shorturl/:id', async (req, res) => {
  let url = await Url.find({ id: req.params.id })
    .then(url => {
      if (url) {
        return url[0].url;
      }
      return false;
    })
    .catch(err => null);

  if (url) {
    return res.status(200).redirect(url);
  }
  res.status(200).json({ error: 'Invalid ID' });
});

// Listen to port
app.listen(port, function() {
  console.log(`Node.js listening on ${port}`);
});
