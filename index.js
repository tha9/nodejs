const express = require('express');
var app = express();
var mysql = require('mysql');

var server = app.listen(process.env.PORT || 3000, listen);
var fs = require('fs');
const { fork } = require('child_process');

const d3 = require("d3");
var jsdom = require("jsdom");
const { JSDOM } = jsdom;

var KEYTOKEN = 6;

var sql = "SELECT token, flyFrom, flyTo, Lowest_Price_Found, Time_Collected, Flight_Date, OW_RT, connections, flight_time_total, a_time_to, duration_to, a_time_from, duration_from, carrier FROM flights"

var con = mysql.createConnection({
  host: "34.68.242.234",
  user: "read_only",
  password: "$$123##abcdefghijklmnopqrstuv!",
  database: "Tracked_Flights"
});


// This call back just tells us that the server has started
function listen() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://' + host + ':' + port);
}

app.use(express.static('public'));
app.use('/data', express.static('data'))

app.use(express.json());
app.use(express.urlencoded({extended: true}));



// And we'll look at all files in the jane austen directory
//var files = fs.readdirSync('austen');

// Pulling our concordance object from a separate "module" - concordance.js
//var Concordance = require('./concordance');


// An object that acts as dictionary of words and counts
//var wordcounts = new Concordance();

// Route for sending all the concordance data
//app.get('/all', showAll);

// Callback
function showAll(req, res) {
  // Send the entire concordance
  // express automatically renders objects as JSON
  console.log(req.body)
  res.send('success');
}

// respond with "hello world" when a GET request is made to the homepage
app.get('/viewdata', function (req, res) {
    
   res.sendFile(__dirname + '/public/data.html');

   // res.send(document);

    
});
    
app.get('/mysql',function(req,res) {
    res.setHeader('Content-Type', 'application/json');
    con.query(sql, function (err, result) {
              if (err) throw err
              res.json(result);
          });
});

app.post('/track-flight', (req, res) => {
    const flyto = req.body.flyto
    console.log(req.body);
    console.log("Now Tracking a flight from "+req.body.flyfrom+" to "+req.body.flyto+"!");
   // fork a process to track flight
   const process = fork('./track.js');
   var oldObj = req.body, newObj = eval({token: KEYTOKEN});
    KEYTOKEN = KEYTOKEN+1;
    for(prop in newObj) {
        oldObj[prop] = newObj[prop];
    }
   const trackdata = JSON.stringify(oldObj);
   
   // send list data to forked process
   process.send(req.body);
   // listen for messages from forked process
   process.on('message', (message) => {
     console.log("Tracking finished")
   });
   return res.json({ status: true, sent: true, Tracking_Duration:req.body.trackingEnd });
});
