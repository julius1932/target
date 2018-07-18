var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
const MongoClient = require('mongodb').MongoClient;
const urlll = "mongodb://localhost:27017/";
var promisez=[];
//var START_URL = "http://www.arstechnica.com";
var START_URL = "https://www.target.com/c/tvs-home-theater-electronics/-/N-5xtdjs";

var MAX_PAGES_TO_VISIT = 1000;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var links=[];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;
var itemz=[];
pagesToVisit.push(START_URL);
//pagesToVisit.push("");
//pagesToVisit.push("");
function crawl() {
  if(pagesToVisit.length<=0 ) {
    console.log("visited all pages.");
    Promise.all(promisez).then(function(values) {
      /*MongoClient.connect(urlll, function(rr, db) {
           if (rr) {isfound=false; return;};
            var dbo = db.db("target");
            var count =0;
            dbo.collection("tv").insert(itemz,function(errr, reslts) {
              console.log('inserted ');
              db.close();
            });
        });*/
    });
    return;
  }
  var nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {
    // We've already visited this page, so repeat the crawl
    crawl();
  } else {
    // New page we haven't visited
    if(nextPage==null){
      return;
    }
    numPagesVisited++;
    visitPage(nextPage, crawl);
  }
}
function requestPage(url, callback) {
  return new Promise(function(resolve, reject) {
      // Do async job
        request.get(url, function(err, resp, body) {
            if (err) {
                reject(err);
                callback();
            } else {
                resolve(body);
            }
        })
    })
}
function visitPage(url, callback) {
  // Add page to our set
  pagesVisited[url] = true;
  // Make the request
  console.log("Visiting page " + url);
  var requestPag = requestPage(url,callback);
  promisez.push(requestPag);
  requestPag.then(function(body) {
    var $ = cheerio.load(body);
    collectAllLinks($);
  //  scrape($);
    callback();
  }, function(err) {
        console.log(err);
        callback ();
    })
  }
  function scrape($){
    var div = $("div#prodDesc");
     for(var i =0; i<div.length;i++){
         var item ={
            category: "Home Theater Systems",
           source: "Fry's Electronics",
           sourceType: "retailer",
           sourceId: 1
         };
         var lnk= $(this).attr('href');
         var text=$('#prodDesc div.prodModel').eq(i).text().trim();
         text =text.split('\n').join(' ');
         var arr  =text.split('\t');
         var arr =arr.filter(str => str && str.includes(":"));
         arr.forEach(function(itm) {
            itm=itm.trim();
            if(itm.includes(":")){
               //console.log(itm);
               var ar  =itm.split(':');
               item[ar[0].trim()]=ar[1].trim();
            }
         });
      //  var price =$("li#did_price1valuediv").text().trim();
        //item.price=price;
        itemz.push(item);
    }
  }
  function collectAllLinks($) {
      var relativeLinks = $("div.styles__PriceTileStyle-j0g2jk-0.gGRJRg a,a.ItemLink-tplkp7-0.hZXrqZ.Link-s1m0vfdz-0.kiDPaD");
      console.log("Found " + relativeLinks.length + "links on page");
      relativeLinks.each(function() {
        var lnk= $(this).attr('href');
        if(lnk != null && lnk.startWith('/')){
           lnk =baseUrl+lnk;
           //console.log(baseUrl);
           if (!(pagesVisited[lnk] || lnk in pagesToVisit )) {
             console.log(lnk);
              pagesToVisit.push(lnk);
           }
        }
      });
  }
  crawl();
