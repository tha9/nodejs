const express = require('express');
var app = express();

var server = app.listen(process.env.PORT || 3001, listen);
var fs = require('fs');
const { fork } = require('child_process');

const d3 = require("d3");
var jsdom = require("jsdom");
const { JSDOM } = jsdom;




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
    var stringy = "";
    var files = fs.readdirSync('./data');
    for (var i = 0; i  < files.length; i++) {
        var txt = ""
        txt = txt+ fs.readFileSync('./data/'+files[i], 'utf8')+" ";
        console.log(files[i]);
        console.log("code to send data to client");
      
    }
    const { window } = new JSDOM();
    const { document } = (new JSDOM('')).window;
    global.document = document;
    var width = 400, height = 70;
    var svg = d3.select("body").append("svg")
                .attr("width", width)
                .attr("height", height);

    // The data set
    var dataset = [1,2,3,4];

    // Add the circles to the svg
    var circles = svg.selectAll("circle")
        .data(dataset)
        .enter()
        .append("circle");

    // d is the data given by callback
    // and i is the data position in the array
    circles.attr("cx", function(d, i) {
                    return (i * 50) + 25;
                })
                .attr("cy", height/2)
                .attr("r", function(d) {
                    return d*2;
                });
    
   res.sendFile(__dirname + '/public/data.html');

   // res.send(document);

    
});
    

app.post('/track-flight', (req, res) => {
    const flyto = req.body.flyto
    console.log(req.body);
    console.log("Now Tracking a flight from "+req.body.flyfrom+" to "+req.body.flyto+"!");
   // fork a process to track flight
   const process = fork('./track.js');
   const trackdata = req.body;
   // send list data to forked process
   process.send(req.body);
   // listen for messages from forked process
   process.on('message', (message) => {
     console.log("Tracking finished")
   });
   return res.json({ status: true, sent: true, Tracking_Duration:req.body.trackingEnd });
});
