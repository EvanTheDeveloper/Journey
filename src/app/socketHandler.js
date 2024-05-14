import { Server } from "socket.io";
import { ProjectClient } from "magicbell/project-client";
import Amadeus from "amadeus";
import airportData from "airport-data-js";
import moment from "moment-timezone";
import fetch from "node-fetch";
import {parseHTML} from "linkedom";

const amadeus = new Amadeus({
    clientId: "cG7EMRtbjimVhHG7AfHJ9ceGStjiOHmk",
    clientSecret: "Vbq0sx4OUiMB0crM"
});

const magicBell = new ProjectClient({
    apiKey: "6983d9579884650be368be63d059b0a1ebedb906",
    apiSecret: "cBdgYj7gJPJ/bZjt7b+mkmTvy49hSfrWoUcllBq7"
});

function testFlightNumber(num, cb) {
    const valid = /^\d+$/.test(num) && num.length <= 4;

    if (cb) {
        cb(valid);
    }

    return valid;
}

export default function init(server) {
    const io = new Server(server);

    io.on("connection", (socket) => {
        socket.on("test-flight-number", testFlightNumber);

        socket.on("add-location-segment", async (data, cb) => {
            cb();
        });

        socket.on("add-plane-segment", async (data, cb) => {
            if (!testFlightNumber(data.flightNum)) return;

            const date = moment(data.flightDate);
            /*const [depTerminal, depGate, arrTerminal, arrGate, depIata, arrIata, depTime, arrTime, duration] = await fetch(`https://www.flightstats.com/v2/flight-details/${data.airline}/${data.flightNum}?year=${date.year()}&month=${date.month() + 1}&date=${date.date()}`).then(async res => {
                console.log(res.url)
                res = parseHTML(await res.text()).document;
                const terminals = [...res.querySelectorAll(".terminalBlock")];
                const gates = [...res.querySelectorAll(".gateBlock")];
                const iatas = [...res.querySelectorAll(".airportCodeTitle")];
                const times = [...res.querySelectorAll(".timeBlock")];
                return [
                    terminals[0].children[1].textContent, 
                    gates[0].children[1].textContent, 
                    terminals[1].children[1].textContent, 
                    gates[1].children[1].textContent, 
                    iatas[0].textContent, 
                    iatas[1].textContent, 
                    times[0].children[1].children[0].textContent,
                    times[4].children[1].children[0].textContent,
                    document.querySelectorAll(".flightTimeBlock")[0].children[2].textContent
                ];
            });*/
            const [depTerminal, depGate, arrTerminal, arrGate, depIata, arrIata, depTime, arrTime, duration] = await fetch(`https://google.com/search?q=${data.airline}${data.flightNum}+${date.year()}-${date.month() + 1}-${date.date()}`).then(async res => {
                console.log(res.url)
                res = parseHTML(await res.text()).document;
                const main = [...res.querySelectorAll(".ZuFvNc")];
                const iatas = [...res.querySelectorAll(".rHwEzf")];
                return [
                    main[1].textContent, 
                    main[2].textContent, 
                    main[4].textContent, 
                    main[5].textContent, 
                    iatas[0].textContent, 
                    iatas[1].textContent, 
                    main[0].textContent,
                    main[3].textContent
                ];
            });

            const depInfo = await airportData.getAirportByIata(depIata).then(info => {return info[0]});
            const arrInfo = await airportData.getAirportByIata(arrIata).then(info => {return info[0]});

            const depMoment = moment(depTime); //moment(`${date.year()}-${((date.month() < 10 ? "0" : "") + (date.month() + 1))}-${((date.date() < 10 ? "0" : "") + (date.date() + 1))}T${depTime.indexOf(":") == 1 ? depTime[0] : depTime.slice(0, 2)}:${depTime.slice(depTime.length-2, depTime.length)}`);
            const arrMoment = moment(arrTime);//depMoment + moment.duration({hours: duration.slice(0, duration.indexOf("h")), minutes: duration.slice(duration.indexOf(" ") + 1, duration.indexOf("m"))}); //moment(`${date.year()}-${((date.month() < 10 ? "0" : "") + (date.month() + 1))}-${((date.date() < 10 ? "0" : "") + (date.date() + 1))}T${arrTime.indexOf(":") == 1 ? arrTime[0] : arrTime.slice(0, 2)}:${arrTime.slice(arrTime.length-2, arrTime.length)}`);
            console.log(depMoment, arrMoment);
            cb({flightId: data.airline + data.flightNum, depAirport: depInfo.airport, arrAirport: arrInfo.airport, depTime: depMoment.toString(), arrTime: arrMoment.toString(), 
                depAddress: `${depInfo.airport} ${depTerminal ? `Terminal ${depTerminal}` : ""}`,
                arrAddress: `${arrInfo.airport} ${arrTerminal ? `Terminal ${arrTerminal}` : ""}`
            });
        });

        socket.on("notify", async (agent) => {
            
            /*const noti = await magicBell.broadcasts.create({
                title: "working",
                content: "notis are working",
                recipients: [{email: "evan.mcghee@gmail.com"}]
            });*/
        });
    });
}