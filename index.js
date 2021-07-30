const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow () {
  const win = new BrowserWindow({
    width: 100,
    height: 100,
    minWidth:500,
    minHeight:520,
    icon:'./icon.png',

    webPreferences:{
      webviewTag:true,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: true,
    /*  devTools: false*/}
  })
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({ responseHeaders: Object.fromEntries(Object.entries(details.responseHeaders).filter(header => !/x-frame-options/i.test(header[0]))) });
    });
  //win.removeMenu()
  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
//webview.addEventListener("ipc-message", function (e)  {
//        if (e.channel === "html-content") {
//            var html_contents = e.args[0];
//            console.log(html_contents);
//        }
//    })
app.commandLine.appendSwitch('disable-site-isolation-trials');




const {ipcMain} = require('electron')

ipcMain.on('resize-window', (event, width, height) => {
    var browserWindow = BrowserWindow.fromWebContents(event.sender);
    browserWindow.setSize(width,height);
})

ipcMain.on('maximise-window', (event, width, height) => {
    var browserWindow = BrowserWindow.fromWebContents(event.sender);
    browserWindow.maximize();
})

const fs = require("fs");

function writeFile (file, content){
  fs.writeFile(file, content, function (err) {
    if (err) throw err;
  });
}


ipcMain.on('readfile', (event, path) =>  {
    if(path == "resources/app/data/files/files.json" ||  path === "database/latest.json" || path === "userdata/usergames.json" ||  path === "userdata/userinfo.json"){
      fs.readFile(path, "utf8", (err, data) => {
        var readPath = path;
        event.sender.send('readfile-return', data, readPath);
      });
    }
});


ipcMain.on('writefile', (event, path, content) =>  {
    if(path == "resources/app/data/files/files.json" ||  path === "database/latest.json" || path === "userdata/usergames.json" ||  path === "userdata/userinfo.json"){
      fs.writeFile(path, content, function (err) {
        var writtenPath = path;
        if (err){
          event.sender.send('writefile-error', err, writtenPath);
        }
        event.sender.send('writefile-return', writtenPath);
      });
    }
});



function launchSteamGame(id){
  if(isNaN(id)){
    return;
  }else{

    command("steam steam://rungameid/" + id + "/");
  }

}

function launchLutrisGame(id){
  var launchid = id.replace(/[^0-9a-z-]/gi, '');
  if(id.replace(/[0-9a-z-]/gi, '').length >0){
    return;
  }else{
    command("lutris lutris:rungame/" + launchid);
  }

}

var exec = require('child_process').exec;

async function execute(command, callback) {
    await exec(command, (error, stdout, stderr) => {
         callback(stdout);
    });
};

async function command(command){
  await execute(command,  (output) =>   {
    console.log(output);
  });
}



ipcMain.on('activateGameSteam', (event) =>  {
  command("steam steam://open/activateproduct");
});

ipcMain.on('uninstallSteamGame', (event, steamID) =>  {
  if(isNaN(steamID)){
    return;
  }else{
    command("steam steam://uninstall/" + steamID + "/");
  }
});

ipcMain.on('installSteamGame', (event, steamID) =>  {
  if(isNaN(steamID)){
    return;
  }else{
    command("steam steam://install/" + steamID + "/");
  }

});


ipcMain.on('openSteamCommunityPage', (event, steamID) =>  {
  if(isNaN(steamID)){
    return;
  }else{

    command("steam steam://openurl/https://steamcommunity.com/app/" + steamID);

  }
});


ipcMain.on('backupSteamGame', (event, steamID) =>  {
  if(isNaN(steamID)){
    return;
  }else{
    command("steam steam://backup/" + steamID + "/");
  }
});
ipcMain.on('viewSteamStorePage', (event, steamID) =>  {
  if(isNaN(steamID)){
    return;
  }else{
    command("steam steam://store/" + steamID + "/");
  }
});

ipcMain.on('viewSteamGameScreenshots', (event, steamID) =>  {
  if(isNaN(steamID)){
    return;
  }else{
    command("steam steam://open/screenshots/" + steamID + "/");
  }
});

ipcMain.on('launchSteamGame', (event, id) =>  {
  if(isNaN(id)){
    return;
  }else{
    launchSteamGame(id);
  }
});

ipcMain.on('launchLutrisGame', (event, id) =>  {
  var launchid = id.replace(/[^0-9a-z-]/gi, '');
  if(id.replace(/[0-9a-z-]/gi, '').length >0){
    return;
  }else{
    launchLutrisGame(launchid);
  }
});


ipcMain.on('openLutris', (event, id) =>  {
    command("lutris");
});

ipcMain.on('installLutrisGame', (event, id) =>  {
  installLutrisGame(id);
});
function installLutrisGame(id){
  var launchid = id.replace(/[^0-9a-z-]/gi, '');
  if(id.replace(/[0-9a-z-]/gi, '').length >0){
    return;
  }else{
    command("lutris lutris:" + launchid);
  }
}
ipcMain.on('downloadFile', (event, response, fileName) =>  {
  const file = fs.createWriteStream("resources/app/data/files/" + fileName);
  response.pipe(file);
});

  function readfile(path){
    var data = fs.readFileSync(path, "utf8");
    return data;
  }
  var imageDatabase = [];
  async function importImageDatabase(){
    imageDatabase = await JSON.parse(await readfile("resources/app/data/files/files.json"));

  }

  importImageDatabase();
  function downloadFile(url, fileName){
    //importImageDatabase();

     if(typeof imageDatabase[url]   == "undefined"){
       const file = fs.createWriteStream("resources/app/data/files/" + fileName);
        const request = https.get(url, function(response) {
          console.log("downloaded file " + url);
          imageDatabase[url] = fileName;
          response.pipe(file);
          writeFile("resources/app/data/files/files.json", JSON.stringify(imageDatabase, null, 2));
        });
     }


  }
  const https = require('https');
  function gitBetween(string, first, last){
    //console.log(string.indexOf(first));
    //console.log(string.indexOf(last));
    var partOne = string.substring(string.indexOf(first), string.length)
    //NICE!!
    return(partOne.substring(partOne.indexOf(first) + first.length, partOne.indexOf(last)));
  }


  function produceImageUrl(url, fileName){
      var fileExtension = url.split('.').pop().replaceAll("?" + gitBetween( url.split('.').pop() + "****", "?", "****"), "");

      if(url.includes("epicgames.com/salesEvent")){
        var fileExtension = "jpg";
      }
      if(fileExtension.includes("net") || fileExtension.includes("com") || fileExtension.includes("uk") || fileExtension.includes("ie") || fileExtension.includes("eu")){
          var fileExtension = "jpg";
      }

      if(typeof imageDatabase[url]  == "undefined"){
        if(fileExtension == "jpg" || fileExtension == "png" || fileExtension == "webm" || fileExtension == "jpeg"){
          downloadFile(url, fileName);
        }

        return("data/files/" + fileName);
      }else{
        return("data/files/" + imageDatabase[url]);
      }

}

  ipcMain.on('produceImageUrl', (event, url, fileName) =>  {
    produceImageUrl(url, fileName);
  });




  ipcMain.on('fetchInstalledSteam', (event) =>  {
    var steamInstalled = [];
    execute("lutris -s",  (output) =>   {
      var steamInstalledRaw = output.split("\n");
    //console.log(steamInstalledRaw);
      var x =0;
      while(x<steamInstalledRaw.length-1){
        steamInstalled.push(gitBetween("***" + steamInstalledRaw[x].trim(), "***", " "));
        x++;
      }
      event.sender.send('steam-installed', steamInstalled);
    });
  });


  ipcMain.on('fetchInstalledLutris', (event) =>  {
    var lutrisInstalledSlugs_ = [];
    execute("lutris -l -o -j",  (output) =>   {
      var lutrisInstalled = JSON.parse("[" + gitBetween(output, "[", "]") + "]");
    //console.log(lutrisInstalledRaw);

    var lutrisgames = [];
      var x =0;
      while(x<lutrisInstalled.length){
        console.log(lutrisInstalled[x]["directory"]);
        if(!lutrisInstalledSlugs_.includes(lutrisInstalled[x]["slug"]) && lutrisInstalled[x]["directory"] !== "null" & lutrisInstalled[x]["directory"] !== ""){
          lutrisInstalledSlugs_.push(lutrisInstalled[x]["slug"]);
          lutrisgames.push(lutrisInstalled[x])
        }
        x++;
      }
      event.sender.send('lutris-installed', lutrisInstalledSlugs_, lutrisgames);
    });
  });

  const { shell } = require('electron');


  function openUrlInBrowser(url){
    shell.openExternal(url);
  }

  ipcMain.on('openUrlInBrowser', (event, url) =>  {
    openUrlInBrowser(url);
  });
