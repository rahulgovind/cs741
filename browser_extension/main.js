
function cleanup(text) {
    var decoded = decodeURIComponent(text);
    var lowercase = decoded.toLowerCase();

    return lowercase;
}

function containsXSS(request) {
    var cleaned = cleanup(request);
    if (cleaned.search("<\\s*script") >= 0) {
		return cleaned.search("<\\s*/\\s*script\\s*>");
    }
}
	

function parseGETFields(details) {
	var url = details.url;
	var idx = url.indexOf('?');
	var query = (idx >= 0 ?  url.substring(idx) : "");
	var urlParams = new URLSearchParams(query);
	var result = {}

	for (pair of urlParams.entries()) {
		result[pair[0]] = pair[1];
	}

	return result;
}

function parsePOSTFields(details) {
	return details.requestBody.formData;
}

function parseFields(details) {
	if (details.method === "POST") {
		return parsePOSTFields(details);
	} else if (details.method === "GET") {
		return parseGETFields(details);
	}

}

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
		var xss = false;
		console.log("Hello world");
		var fields = parseFields(details);
		for (key in fields) {
			var value = fields[key];
			if (value.isArray) {
				for (v in value) {
					xss = containsXSS(fields[key]) || xss;
				}
			} else {
				xss = containsXSS(fields[key] || xss);
			}


			if (xss)
				break;
		}
		
		if (xss) {
			return {cancel : true};
		}
	},
    {
		urls: ["<all_urls>"]
	},
    ["blocking", "requestBody"]
);
