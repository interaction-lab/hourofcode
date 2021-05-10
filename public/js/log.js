class Log {
	constructor() {
		this.db = firebase.firestore();
		// Participant IP address fetch
		this.IPAddress = "";
		let apiKey = '97da8bc6edef8922e8332eef9df13875c2cb3dbdb8175607d62c5c67';
		this.json("https://api.ipdata.co?api-key=" + apiKey).then(data => {
		 	this.IPAddress = data.ip;
			this.db.collection(this.IPAddress).doc("initial").set({
			    creationTime: Date.now(),
			})
		});
		this.count = 0;
	}

	update(time, landmarks, poseDetected) {
		const landmarksMap = { ...landmarks };
		const flattenedData = new Map();
		for (var key in landmarksMap) {
			const coordinates = landmarks[key];
		    for (var cKey in coordinates) {
		    	flattenedData.set(cKey+key, coordinates[cKey]);
		    }
		}
		flattenedData.set('poseDetected', poseDetected);
		this.db.collection(this.IPAddress).doc(time.toString()).set(this.strMapToObj(flattenedData));
	}

	json(url) {
	  return fetch(url).then(res => res.json());
	}

	strMapToObj(strMap) {
	  let obj = Object.create(null);
	  for (let [k,v] of strMap) {
	    obj[k] = v;
	  }
	  return obj;
	}
}