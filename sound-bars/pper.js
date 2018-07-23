const puppeteer = require('puppeteer');
var URL = require('url-parse');
var jsonfile = require('jsonfile');
var START_URL = "https://www.target.com/s?searchTerm=sound+bars";
var MAX_PAGES_TO_VISIT = 1000;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];

var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;
var count=0;
pagesToVisit.push(START_URL);
var file='jsonDat.json';
var items =jsonfile.readFileSync(file);
async function crawl() {
    if(pagesToVisit.length<=0 ) {
        console.log("all pages visted "+count+" items ."+items.length+"  all now");
        if(items.length>=0){
            jsonfile.writeFile(file,items, {spaces: 2},function (err) {//
               console.error(err+' ==');
            });
        }
        return ;
    }
    var nextPage = pagesToVisit.pop();
     if (nextPage in pagesVisited) {
           // We've already visited this page, so repeat the crawl
           crawl();
        } else {

         // New page we haven't visited
    if(nextPage==null){
        crawl();
    }
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 926 });
    await page.goto(nextPage);
    if(START_URL!=nextPage){
        await page.click('button.Button-s1all4g7-0.jAJqvB');
        //await page.screenshot({path: 'image-taget.png', fullPage: true});
    }
    //await page.waitForSelector("div.h-margin-a-default Row-fhyc8j-0.gOdoOA");
  console.log("on-------"+nextPage);
    let hotelData = await page.evaluate(() => {
        let hotels = [];
        // get the hotel elements
        let lnkElms = document.querySelectorAll('a.h-margin-b-tiny.h-display-block.h-text-overflow-ellipsis.Link-s1m0vfdz-0.kiDPaD');
        var  brand = document.querySelector("div.Col-lvtw7q-0.cOAtHo > h1.h-text-hd2.h-margin-b-none.h-margin-b-tiny.h-text-normal.h-margin-t-default");
         var model;  
        if(brand){
            brand = document.querySelector("div.Col-lvtw7q-0.cOAtHo  h1.h-text-hd2.h-margin-b-none.h-margin-b-tiny.h-text-normal.h-margin-t-default").textContent;
            brand =brand.split(" ");
            if(brand){
               brand=brand[0] ;
            }
        }
        let models = document.querySelectorAll("div.h-padding-b-tight");
        models.forEach((mdl) => {
            try {
                let modl =mdl.textContent;
                if(modl.includes('Model')){
                    var arr=modl.split(":");
                    if(arr.length>=2){
                        model=arr[1].trim();
                    }
                   
                }
                
            }  catch (ex){
              console.log(ex);
            }
        
        });
        // get the hotel data
        lnkElms.forEach((lnkEl) => {
            try {
                let lnk =lnkEl.getAttribute('href');
                //let re1 = new RegExp("blu");
                hotels.push(lnk);
                
            }  catch (ex){
              console.log(ex);
            }
        
        });
        return {links:hotels, brand:brand,model:model};
    });
    hotelData.links.forEach((lnk) => {
        if(lnk != null && lnk.startsWith('/')){
        lnk =baseUrl+lnk;
        if (!(pagesVisited[lnk] || lnk in pagesToVisit )) {
            pagesToVisit.push(lnk);
        }
    }
    });
    console.log(hotelData.links.length+" -------");
    console.log(hotelData.brand+" -------"+hotelData.model);
    console.log(pagesToVisit.length+" ------->>");

    if(hotelData.brand){
        count++;
        var model=""
        if(hotelData.model){
           model= hotelData.model;
        }
        items.push({
            brand:hotelData.brand,
            model:model,
            url:nextPage,
            category: "Sound Bars",
            source: "Target", 
            sourceType: "retailer",
            sourceId: 2
        })
    }
    browser.close();
    crawl();
}

}
crawl();
