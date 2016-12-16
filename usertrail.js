/*
BSD 2-Clause License

Copyright (c) 2016, Benjamin Cordier
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var UserTrail = function (config)
{
	this.protInit(config); // initialize at object instantiation
};

UserTrail.prototype = {

	// initialization within the prototype
	protInit: function (config) {

		this.tracks 		 =  []; // the records
		this.sessUID             =  singletonSessUID,
		this.sessLoadTime 	 =  new Date();
		this.trackingCount       =  Number.isInteger(config.trackingCount) ? config.trackingCount : 1,
		this.trackingEvents	 =  Array.isArray(config.trackingEvents)	=== true ? config.trackingEvents : ['mouseup', 'mousedown'],
		this.trackingElement     =  typeof(config.trackingElement)	== "string"	? config.trackingElement : 'tracker',
		this.sessApiEndpoint 	 =  typeof(config.sessApiEndpoint) == "string" ? config.sessApiEndpoint : 'http://127.0.0.1/your/app/endpoint',
                this.trackApiEndpoint 	 =  typeof(config.trackApiEndpoint) == "string" ? config.trackApiEndpoint : 'http://127.0.0.1/your/app/endpoint',
		this.trackingEventType   =  typeof(config.trackingEventType)	== "string"	? config.trackingEventType : 'tracking', // either tracking or conversion
		this.trackingElementType =  typeof(config.trackingElementType)	== "string"	? config.trackingElementType : 'cssClass', // either cssClass or id

		this.protAttachEvents(); // attach events

		if (this.trackingCount  === 0) // allow loggin opening session only once
		{
			this.protLogSessSignature('opening'); // log opening session signature
		}

		return this;

	}, // EOF initialization within the prototype


	// attach events to be tracked
	protAttachEvents: function () {

		var trail	= this;

		if (trail.trackingEventType == "tracking") // check the event type [track or conversion]
		{

			for (var i = 0; i < trail.trackingEvents.length; i++)
			{

					var tEvent	= trail.trackingEvents[i];

					if (trail.trackingElementType == "cssClass") // check the element type [cssClass or id]
					{

						targets = document.getElementsByClassName(trail.trackingElement);

						for (var j = 0; j < targets.length; j++)
						{

							trail.protAttachEvent(targets[j], tEvent, function (e)
							{
								e.stopPropagation ? e.stopPropagation() : (e.cancelBubble = true)
								trail.protLogTrack(e, trail.trackingEventType);
							});

					  }

					}
					else if (trail.trackingElementType == "id")
					{

						target = document.getElementById(trail.trackingElement);

						trail.protAttachEvent(target, tEvent, function (e)
						{
							e.stopPropagation ? e.stopPropagation() : (e.cancelBubble = true)
							trail.protLogTrack(e, trail.trackingEventType);
						});

					}
					// EOF check the element type [cssClass or id]

			}

		} // EOF check the event type [trail or conversion]

		// attach log for clossing session onbeforeunload event
		window.onbeforeunload = function (e)
		{
			trail.protLogSessSignature('closing'); // log closing session signature
		};

		return this;

	}, // EOF attach events to be tracked

	// attach individual event to be tracked
        protAttachEvent: function (element, customEvent, fnc)
	{

		return ((element.attachEvent) ? element.attachEvent('on' + customEvent, fnc) : element.addEventListener(customEvent, fnc, false));

 	}, // EOF attach individual event to be tracked

	// log track object into tracks records array
	protLogTrack: function (e, type)
	{

		 var trail = this,

			// trackPack object
			trackPack 	=
			{

				sessionID : trail.sessUID,
				trackID   : UUIDV4.getUUIDV4(),
				type 			: type,
				event 			: e.type,
				targetId    : e.target.id,
				targetTag 		: e.target.tagName,
				targetClasses 	: trail.trackingElement,
				clientPosition  : {
					x 				: e.clientX,
					y 				: e.clientY
				},
				screenPosition 	: {
					x 				: e.screenX,
					y 				: e.screenY
				},
				trackCreatedAt 		: new Date()

			};

		console.log(JSON.stringify(trackPack));

		// send trackPack(s) to server
		trail.protsendTrackPacket(trackPack, 'track');

		console.log(type+" data for event "+e.type+" has been sent");

		return this;

	}, // EOF log track object into tracks records array


	// log session siganture
	protLogSessSignature: function (type)
	{

		var trail 	= this,

		// Generate Session Data Object
		sessPack =
		{

			sessionID   : trail.sessUID,
			sessionType : type,
			loadTime 		: trail.sessLoadTime,
			unloadTime 	: type	== 'closing' ? new Date() : '1979-10-10 10:10:10',
			language 		: window.navigator.language,
			platform 		: window.navigator.platform,
			port 			  : window.location.port,
			client 			: {
				name 		: window.navigator.appVersion,
				innerWidth 	: window.innerWidth,
				innerHeight 	: window.innerHeight,
				outerWidth 	: window.outerWidth,
				outerHeight 	: window.outerHeight
			},
			page 			: {
				location 	: window.location.pathname,
				href 		: window.location.href,
				origin 		: window.location.origin,
				pageTitle 	: document.title
			},

		};

		console.log(JSON.stringify(sessPack));

		trail.protsendTrackPacket(sessPack,'sess');

		console.log(type+" session siganture data has been sent");

		return this;

	}, // EOF log session siganture

	// send packets(s) to server
	protsendTrackPacket: function (trackPacket, packetType)
	{

		var trail = this,

		// Initialize Cross Header Request
		xhr = new XMLHttpRequest();

		// post trail session data serialized as JSON
		if(packetType == "sess")
		{
			xhr.open('POST', trail.sessApiEndpoint, true);
		}
		else if(packetType == "track")
		{
			xhr.open('POST', trail.trackApiEndpoint, true);
		}

		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify(trackPacket));

		return this;

	} // EOF send packets(s) to server


}; // EOF Trail prototype

// generate UUID V4 object
var UUIDV4 = new function()
{

    this.getUUIDV4 = function ()
		{
	    var nbr, randStr = "";
	    do
			{
	        randStr += (nbr = Math.random()).toString(16).substr(2);
	    } while (randStr.length < 30);
	    return [
	        randStr.substr(0, 8), "-",
	        randStr.substr(8, 4), "-4",
	        randStr.substr(12, 3), "-",
	        ((nbr*4|0)+8).toString(16),
	        randStr.substr(15, 3), "-",
	        randStr.substr(18, 12)
	        ].join("");
	  }

}; // EOF generate UUID V4 object


var singletonSessUID = UUIDV4.getUUIDV4(); // generate singleton session id for the user in session
