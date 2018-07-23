const puppeteer = require('puppeteer');
var URL = require('url-parse');
var jsonfile = require('jsonfile');
var START_URL = "https://www.staples.com/Receivers-Amplifiers/cat_CL167927?icid=TVSTREAMINGSUPERCAT:LINKBOX3:HOMETHEATER4:RECEIVERSAMPLIFIERS::::";
var MAX_PAGES_TO_VISIT = 1000;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];

var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;
var count=0;
pagesToVisit.push(START_URL);
for(var i =1;i<=6;i++){//4
    var crrlink ="https://www.staples.com/Receivers-Amplifiers/cat_CL167927?fids=&pn="+i+"&sr=true&sby=&min=&max=&myStoreId=";
    pagesToVisit.push(crrlink);
}
var file='jsonDat.json';
var items =jsonfile.readFileSync(file);
var arrModel=[];
items.forEach(function(itm) {
    arrModel.push(itm.brand+itm.model);
});
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
    var nextPage = pagesToVisit.shift();
     if (nextPage in pagesVisited) {
           // We've already visited this page, so repeat the crawl
           crawl();
        } else {

         // New page we haven't visited
    if(nextPage==null){
        crawl();
    }
    const browser = await puppeteer.launch({ headless:false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 926 });
    await page.goto(nextPage);
    //await page.screenshot({path: 'image-staples.png', fullPage: true});
    if(START_URL!=nextPage){
        //await page.click('button.Button-s1all4g7-0.jAJqvB');
        //await page.screenshot({path: 'image-taget.png', fullPage: true});
    }
    //await page.waitForSelector("a.div.product-image a.scTrack.pfm");
  console.log("on-------"+nextPage);
    let hotelData = await page.evaluate(() => {
        let hotels = [];
        // get the hotel elements
        let lnkElms = document.querySelectorAll('div.product-info a.scTrack.pfm');
        var  brand = document.querySelector("h1.product-title");
        if(brand){
            brand = brand.textContent;
        }
        var modl = document.querySelector("div.item-model span#mmx-sku-manufacturerPartNumber");
        if(modl){
           modl = modl.textContent;
        }
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
        return {links:hotels, brand:brand,model:modl};
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
        var brand=hotelData.brand;
        var model="";
        if(hotelData.model){
           model= hotelData.model;
        }
        if(!arrModel.includes(brand+model)){
             items.push({
                 brand:brand,
                 model:model,
                 url:nextPage,
                 category: "Audio/Video Receiver",
                 source: "Staples",
                 sourceType: "retailer",
                 sourceId: 6
             });
      }
    }
    browser.close();
    crawl();
}

}
crawl();
