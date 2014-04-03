
ltcrabbit = window.ltcrabbit = {}

ltcrabbit.address = 'https://www.ltcrabbit.com/index.php'

ltcrabbit.url = function(action, apikey, id)
{
	url = ltcrabbit.address + '?page=api&action=' + action 
	if (apikey)
		url += '&api_key=' + apikey
	if (id)
		url += '&id=' + id
	return url
}

ltcrabbit.eval = function(action, apikey, id, cb, eb)
{
	var url = ltcrabbit.url(action, apikey, id)
	if (url) {
		//console.log('GET: ' + url)
		$.ajax({
		    url: url,
		    dataType: "json"
		}).done(function(data){
			//console.log(JSON.stringify(data))
			cb(data)
		}).fail(function(){
		    eb()
		})
	} else {
		eb()
	}
}

ltcrabbit.getblockcount = function(apikey, cb, eb)
{
	ltcrabbit.eval('getblockcount', apikey, null, 
		function(data)
		{	cb(data.getblockcount)
		},
		eb
	)
}

ltcrabbit.getdifficulty = function(apikey, cb, eb)
{
	ltcrabbit.eval('getdifficulty', apikey, null, 
		function(data)
		{	cb(data.getdifficulty)
		},
		eb
	)
}

ltcrabbit.getuserstatus = function(apikey, cb, eb)
{
	ltcrabbit.eval('getuserstatus', apikey, null, 
		function(data)
		{	cb(data.getuserstatus)
		},
		eb
	)
}

ltcrabbit.getuserworkers = function(apikey, cb, eb)
{
	ltcrabbit.eval('getuserworkers', apikey, null, 
		function(data)
		{	
			data.getuserworkers.forEach(function (v, i, a) {
				if (a[i].active) {
					a[i].state = 'active'
				} else {
					a[i].state = 'inactive'
				}
			})
			cb(data.getuserworkers)
		},
		eb
	)
}

ltcrabbit.api2 = {
	appname: 'ltcrabbitjs',
	appversion: '0.0.1'
}

ltcrabbit.api2.url = function(action, apikey, appname, appversion)
{
	url = ltcrabbit.address + '?page=api&action=' + action 
	if (apikey) {		
		url += '&api_key=' + apikey
		url += '&appname=' + (appname || ltcrabbit.api2.appname)
		url += '&appversion=' + (appversion || ltcrabbit.api2.appversion)
	}
	return url
}

ltcrabbit.api2.eval = function(action, apikey, cb, eb)
{
	var url = ltcrabbit.api2.url(action, apikey)
	if (url) {
		console.log('GET: ' + url)
		$.ajax({
		    url: url,
		    dataType: "json"
		}).done(function(data){
			cb(data)
		}).fail(function(){
		    eb()
		})
	} else {
		eb()
	}
}

ltcrabbit.api2.getappdata = function(apikey, cb, eb)
{
	ltcrabbit.api2.eval('getappdata', apikey, 
		function(data)
		{	cb(data.getappdata)
		},
		eb
	)
}