module.exports = {
    checkMap: function checkMap(mapname){
        switch(mapname){
            case "MP_Abandoned":
                return "Fabryka 311";
            case "MP_Flooded":
                return "Strefa powodziowa";
            case "MP_Damage":
                return "Zapora na Mekongu";
            case "MP_Journey":
                return "Golmud";
            case "MP_Naval":
                return "Paracele";
            case "MP_Prison":
                return "Op. Blokada";
            case "MP_Resort":
                return "Resort Hainan";
            case "MP_Siege":
                return "Obl. Szanghaju";
            case "MP_TheDish":
                return "Wroga transmisja";
            case "MP_Tremors":
                return "O brzasku";
            case "MP_017":
                return "Kanały Noshahr";
            case "MP_011":
                return "Sekwana";
            case "MP_Subway":
                return "Metro";
            case "MP_001":
                return "Bazar";
            default:
                return mapname;
        }
    },
    getMinutes: function getMinutes(seconds){
        let minutes, hours;
        if(seconds<60){
            return seconds + " sec";
        }
        minutes = Math.round(seconds/60);
        if(minutes<60){
            return minutes + " min";
        }
        hours = Math.round(minutes/60);
        minutes = minutes % 60;
        return hours + " h " + minutes + " min";
    }
}
