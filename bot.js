const ServerID = 8;
const util = require('util');
const pmysql = require('promise-mysql');
let doSwap = false;
let lobby, team1a, team2a, team1b, team2b, interval;

const mysql = require('mysql');
const bf4data = require('./bf4data');
var con = mysql.createConnection({
    host: "176.57.191.232",
    user: "db_4869077_1",
    password: "SPxirvIJ"
});
//fajne
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to db!");
    con.query("USE db_4869077_1", function(err,result) {
        if (err) throw err;
        console.log("Changed database!");
    })
});

const query = util.promisify(con.query).bind(con);

async function getChannels(){
    //pobranie kanałów do zmiennych
    let guild = await client.guilds.fetch("464483598658043906");
    try{
        lobby = await client.channels.fetch("787108405285486592");

        team1a = await client.channels.fetch("787105574553780234");

        team1b = await client.channels.fetch("787105801834725376");

        team2a = await client.channels.fetch("787106954661068860");

        team2b = await client.channels.fetch("787107486959796256");  
        
    }catch(err){
        console.log(err.stack);
    }
}

function swapManager(){
    getChannels();
    swapChannels(lobby);
    swapChannels(team1a);
    swapChannels(team1b);
    swapChannels(team2a);
    swapChannels(team2b);
}

async function swapChannels(channel){
    let team, user, member, soldier, result;
    //czy kanał pusty?
    if(member == channel.members.array()[0]){
        return;
    }

    
    let users = channel.members.array();

    for(let i = 0; i<users.length; i++){
        result, user, member = "";
        user = users[i].id;
        member = users[i];
        
        //czy użytkownik dalej jest na kanale
        if(!member.voice.channel == channel){
            continue;
        }

        //pobranie nazwy gracza z bazy danych
        try{
            result = await query('SELECT playerName FROM discord_users WHERE discord_users.discordID=?', [user]);
        }catch(e){
            e=>null;
            continue
        }

        if (result[0]){
            soldier = result[0].playerName;
        }else{
            continue
        }

        //pobranie ID teamu z bazy danych
        try{
            result = await query('SELECT TeamID FROM tbl_currentplayers WHERE tbl_currentplayers.Soldiername=?', [soldier]);
        }catch(e){
            e=>null;
            continue
        }
        if(result[0]){
            team = result[0].TeamID;
            
            //po dwa kanaly
            //nie dopelniaj do osemki

            if(team == 1){
                member.voice.setChannel(team1a);
                //użytkownicy na kanałach z teamu 1
                /*if(member.voice.channel == team1a || member.voice.channel == team1b){
                    console.log("channel - ok");
                    member.voice.setChannel(team1a);
                }else{
                    if(team1a.full){
                        member.voice.setChannel(team1b);
                    }else{
                        member.voice.setChannel(team1a);
                    }
                }*/
            }

            if(team == 2){
                member.voice.setChannel(team2a);
                //użytkownicy na kanałach z teamu 2
                /*if(member.voice.channel == team2a || member.voice.channel == team2b){
                    console.log("channel - ok");
                }else{
                    if(team2a.full){
                        member.voice.setChannel(team2b);
                    }else{
                        member.voice.setChannel(team2a);
                    }
                }*/
            }
        }
        
        
    }
    return;
}

function swapInterval(channel){
    //przełącznik sortowania
    if(doSwap){
        channel.send("Rozpoczynam automatyczne przerzucanie graczy");
        interval = setInterval(swapManager, 15000);
    }else{
        channel.send("Zatrzymuję automatyczne przerzucanie graczy");
        clearInterval(interval);
    }
}

function getAdmins(channel){
    //lista administratorów na serwerze
    con.query("SELECT `user_name` FROM `db_4869077_1`.`adkats_users` WHERE user_role='2'", function(err,result, fields) {
        if (err) throw err;
        channel.send("Administratorzy serwera BFF: ");
        for(let value of result){
            channel.send(value.user_name);
        }
    })
}

async function getStats(channel, player, msg){
    //brak podanego nicku - baza graczy discord
    if(player == undefined || player == "" || player == "bfstats"){
        player = msg.author.id;
        try {
            player = await query("SELECT playerName FROM discord_users WHERE discord_users.discordID = ?", [player]);
            player = player[0].playerName;
        } catch (e) {
            e=>null;
            channel.send("**Brak statystyk dla tego gracza!** Błędnie wpisany nick lub nie ma go w bazie danych");
            return;
        }
    }
    //pobranie statystyk
    con.query('SELECT tbl_playerstats.* FROM tbl_playerstats, tbl_playerdata, tbl_server_player WHERE tbl_playerdata.SoldierName = ? AND tbl_playerdata.PlayerID = tbl_server_player.PlayerID AND tbl_server_player.StatsID = tbl_playerstats.StatsID', [player], function (err, result) {
        if (result[0] == undefined || result[0] == ""){
            channel.send("**Brak statystyk dla tego gracza!** Błędnie wpisany nick lub nie ma go w bazie danych");
            return;
        }else{
        let embed0 = {
                "title": "Statystyki gracza **" + player + "**",
                "color": 16711680,
                "description": `**Zabójstw**:${result[0].Kills}\n**Headshotów**: ${result[0].Headshots}\n**Śmierci**:${result[0].Deaths}\n**Punktów łącznie**: ${result[0].Score}\n**Łączny czas na serwerze**: ${bf4data.getMinutes(result[0].Playtime)}`,
                "timestamp": null,
                "author": {
                  "name": "",
                  "icon_url": ""
                }
        }
        let embed1 = {
            "title": "",
            "color": 28415,
            "description": `**Pozycja w rankingu punktów**: ${result[0].rankScore}\n**Pozycja w rankingu zabójstw**: ${result[0].rankKills}\nStatystyki są aktualizowane po zakończonej rundzie`,
            "timestamp": ""
        }
        channel.send({embed: embed0});
        channel.send({embed: embed1});
        }
        err=>null;
    })
}

async function getPinned(channel){
    try {
        let pinned = channel.messages.fetchPinned();

    } catch (error) {
        console.error(error);
    }
    console.log(pinned);
}

async function getStatus(channel){
    //TODO: dodać liczenie ile na serwerze jest ludzi z plutonu (kiedys tam xd)
    var mapname, playercount, tickets0, tickets1, result;
    //playercount
    try {
        result = await query("SELECT * FROM tbl_currentplayers");
        if(result.length){
            playercount = result.length;
        }else{
        playercount = 0;
        }
        channel.send(`Liczba graczy - ${playercount}`);
    } catch (err) {
        err=>null;
    }
    
    
    
    //mapname
    con.query("SELECT mapName FROM tbl_server WHERE tbl_server.ServerID = ?",[ServerID], (err, result)=>{
        mapname = bf4data.checkMap(result[0].mapName);
        channel.send(`Na mapie ${mapname}`);
        err=>null;
    })
}
async function addUser(msg){
    console.log(msg.content);
    const args = msg.content.slice(5).trim().split(' ');
    if(args.length !== 3){ 
        msg.reply("podaj odpowiednie informacje w kolejności: bfadd wzmianka_discord dokładny_nick_battlefield premium_tak_lub_nie");
        msg.channel.send("Przykład:");
        msg.channel.send("bfadd <@363332759755685889> kapsel_bf tak");
        msg.channel.send("Wskazówka - uważaj na spacje pomiędzy argumentami");
        return;
    }
    switch (args[2]){
        case "tak":
            args[2] == 1;
            break;
        case "nie":
            args[2] == 0;
            break;
        default:
            msg.reply("podaj odpowiednie informacje w kolejności: bfadd wzmianka_discord dokładny_nick_battlefield premium_tak_lub_nie");
            msg.channel.send("Przykład:");
            msg.channel.send("bfadd <@363332759755685889> kapsel_bf tak");
            msg.channel.send("Wskazówka - uważaj na spacje pomiędzy argumentami");
            return;
    }
    
    //check if data is already in the database
    let user;
    if(args[0].slice(args[0].indexOf("@") + 1, args[0].indexOf(">")).includes("!")){
        user = args[0].slice(args[0].indexOf("!") + 1, args[0].indexOf(">"));
    }else{
        user = args[0].slice(args[0].indexOf("@") + 1, args[0].indexOf(">"));
    }
    
    try{
        user = await client.users.fetch(user);
    }catch(e){
        msg.reply("nieprawidłowa wzmianka");
        e=>null;
        return;
    }
    if(user == msg.member.user || msg.member.hasPermission(['ADMINISTRATOR'])){
        try{
            let test = await query('SELECT * FROM discord_users WHERE discordName=? OR playerName=? OR discordID=?', [user.username,args[1],user.id]);     
            if(test[0] !== undefined){
                msg.reply("użytkownik znajduje się już w bazie. Sprawdź czy dane nie powielają się z innym rekordem"); 
                return;
            }
        }
        catch(e){
            e=>null;
        }
        
        try{
        query("INSERT INTO discord_users(discordName,playerName,discordID,dateAdded,isPremium) VALUES (?,?,?,CURRENT_TIMESTAMP(),?)", [user.username,args[1],user.id,args[2]]);
        }catch(e){
            console.log(e);
            return;
        }
        msg.reply(`dodano użytkownika ${args[1]} do bazy danych!`);
    }else{
        msg.reply("Możesz dodać tylko siebie!");
        return;
    }

}

async function removeUser(msg){

    const args = msg.content.slice(8).trim().split(' ');
    if(args.length !== 1){ msg.reply("podaj odpowiednie informacje w kolejności: bfremove <wzmianka_discord>"); return}
    let user;
    if(args[0].slice(args[0].indexOf("@") + 1, args[0].indexOf(">")).includes("!")){
        user = args[0].slice(args[0].indexOf("!") + 1, args[0].indexOf(">"));
    }else{
        user = args[0].slice(args[0].indexOf("@") + 1, args[0].indexOf(">"));
    }

    try{
        user = await client.users.fetch(user);
    }catch(e){
        msg.reply("nieprawidłowa wzmianka");
        e=>null;
        return;
    }
    if(user == msg.member.user || msg.member.hasPermission(['ADMINISTRATOR'])){
        try{
            let id = con.escape(user.id);
            //for some reason can't use question marks here?!
            if(await query(`DELETE FROM discord_users WHERE discordID=${id}`)){msg.reply(`Użytkownik ${user.username} został usunięty z bazy danych`); return;}
        }catch(e){
            msg.reply("użytkownik nie znajduje się w bazie danych");
            e=>null;
            return;
        }
    }else{
        msg.reply("możesz usunąć tylko siebie!");
    }
}

const discord = require('discord.js');
const { timeStamp } = require('console');
const client = new discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    //random status
    let random = 1;
    setInterval(() => {
        switch (random) {
            case 1:
                client.user.setActivity("Lata Viperem");
                break;
            case 2:
                client.user.setActivity("Szturmuje M-COM");
                break;
            case 3:
                client.user.setActivity("Skacze Vouzou");
                break;
            case 4:
                client.user.setActivity("Sprawdza statystyki");
                break;
        }
        if(random == 4){
            random = 1;
        }else{
            random ++;
        }
    }, 10000);
});

client.on('message', msg => {
    const server = msg.guild;
    const channel = msg.channel;
    //admin list
    if(msg.content.startsWith("bfadmins")){
        getAdmins(channel);
    }
    //server player stats
    if(msg.content.startsWith ("bfstats")){
        let player = msg.content.substring(msg.content.lastIndexOf(" ") + 1);
        getStats(channel, player, msg);
    }
    //server status
    if(msg.content.startsWith("bfstatus")){
        getStatus(channel);
    }
    //change user's channel
    if(msg.content == "bfswap"){
        if(msg.member.hasPermission(['ADMINISTRATOR']) || msg.member.id == "363332759755685889"){
            doSwap = !doSwap;
            swapInterval(channel);
        }else{
            channel.send("Brak permisji dla tej komendy");
            return;
        }        
        
    }
    if(msg.content == "bfswap lobby"){
        if(msg.member.hasPermission(['ADMINISTRATOR']) || msg.member.id == "363332759755685889"){
            swapChannels(lobby);
        }else{
            channel.send("Brak permisji dla tej komendy");
            return;
        }
        
    }
    if(msg.content == "bfpinned"){
        if(msg.member.hasPermission(['ADMINISTRATOR']) || msg.member.id == "363332759755685889"){
            getPinned(channel);  
        }else{
            channel.send("Brak permisji dla tej komendy");
            return;
        }        
        
    }
    if(msg.content.startsWith("bfadd")){
        addUser(msg);
    }
    if(msg.content.startsWith("bfremove")){
        if(msg.member.hasPermission(['ADMINISTRATOR']) || msg.member.id == "363332759755685889"){
            removeUser(msg);
        }else{
            channel.send("Brak permisji dla tej komendy");
            return;
        }        
        
    }
  });

client.login();