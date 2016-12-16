# UserTrailJS

You can track a user's activities on your page by element classes and element ids already on your page. Use the elementsToTrack array to set up specific elements to be tracked.

Example:

	var elementsToTrack = [
		{
		  element     : "input-1",
		  events      : ["mouseup", "touchend"],
		  eventType   : "tracking", // can be ignored
		  elementType : "cssClass"  // can be ignored
		}, 
		{
		  element     : "video-1",
		  events      : ["pause", "play", "seeked", "volumechange", "error"],
		  eventType   : "tracking", // can be ignored
		  elementType : "id"        // can be ignored
		}
	];

	for (var i = 0; i < elementsToTrack.length; i++)
	{

	    var el = elementsToTrack[i];

	    new UserTrail({

	      trackingCount       : i,
	      trackingElement     : el.element,
	      trackingEvents      : el.events,
	      trackingEventType   : el.eventType,
	      trackingElementType : el.elementType,
	      trackApiEndpoint    : '/trackEndpoint',  // can be ignored for a value set in usertrail.js
	      sessApiEndpoint     : '/sessApiEndpoint' // can be ignored for a value set in usertrail.js

	    });

	} 
  
  No HTML update is neccessary! Works with the existing HTML.
