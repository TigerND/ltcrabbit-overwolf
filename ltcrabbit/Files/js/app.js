
app = window.app = {}

app.nullState = {
	username: 'n/a',
	balance: 0,
	hashrate: 0,
	sharerate: 0,
}

app.difficulty = 0
app.state = $.extend({}, app.nullState)
app.workers = []
app.errCount = 0

app.localStorage = window.localStorage

app.config = {
	key: 'v0.config',
	active: {
		url: 'https://www.ltcrabbit.com/index.php',
		username: '',
		apikey: '',
		interval: 5000,
	}
}

app.config.load = function()
{
	var self = this
	return app.trace('app.config.load()', function()
	{	  
		conf = app.localStorage.getItem(app.config.key)
		if (conf) {
			var config = JSON.parse(conf)
			app.config.activateConfig(config)
		}
		return app.config.valid()
	})
}

app.config.save = function()
{
	app.localStorage.setItem(app.config.key, JSON.stringify(app.config.active))
}

app.config.activateConfig = function(conf)
{
	var self = this
	return app.trace('app.config.activateConfig()', function()
	{	  
		app.config.active = conf
		
		if (!app.config.active.url)
			app.config.active.url = ltcrabbit.address
		app.config.active.interval = Math.max(app.config.active.interval, 5000)
		
		ltcrabbit.address = app.config.active.url
		app.config.save()
	
		app.errCount = 0
		app.state = jQuery.extend({}, app.nullState)
		app.workers = []
	
		app.onStateChanged()
	})
}

app.config.valid = function()
{
	return (app.config.active.url && app.config.active.username && app.config.active.apikey)
}

app.start = function()
{
	var self = this
	return app.trace('app.config.activateConfig()', function()
	{	  
	    Overwolf.games.onGameInFocusChanged = function()
	    {
	        //console.log('Game in focus changed')
	    }
	
	    Overwolf.games.onRunningGameChanged = function()
	    {
	    	//console.log('Running game changed')
	    }
	    
	    Overwolf.window.onLocationChange = function()
	    {
	    	//console.log('Location changed')    	
	    }
	
	    Overwolf.window.onResize = app.onResized()
	
	    Overwolf.Connect()    
	        
	    if (app.config.load()) {
	    	console.log('Config loaded')
	    	app.layout.vertical.activate()    	
	    } else {
	    	console.log('Config not found')
	    	app.layout.settings.activate()
	    }
	    
		app.update()
	})
}

app.update = function()
{
	ltcrabbit.getdifficulty(app.config.active.apikey, 
		function(state)	{
			app.difficulty = state
			app.onUpdatePassed()
		}, 
		app.onUpdateFailed
	)

	ltcrabbit.getuserstatus(app.config.active.apikey,
		function(state)	{
			app.state = state
			app.onUpdatePassed()
		}, 
		app.onUpdateFailed
	)

	ltcrabbit.getuserworkers(app.config.active.apikey, 
		function(workers) {
			app.workers = workers
			app.onUpdatePassed()
		},
		app.onUpdateFailed
	)

	setTimeout(app.update, app.config.active.interval)
}

app.onUpdatePassed = function()
{
	app.errCount = 0
	app.onStateChanged()
}

app.onUpdateFailed = function()
{
	app.errCount += 1
	app.onStateChanged()
}

app.onResized = function()
{
	if (app.layout.current)
		app.layout.current.onResized()
}

app.onStateChanged = function()
{
	var self = this
	return app.trace('app.onStateChanged()', function()
	{	  
		if ((app.state) && (app.state.username != undefined))
		{
			app.workers.forEach(function(v, i, a) {
				var userName = v.username
				if (userName.indexOf(app.state.username + '.') == 0) {
					a[i].workername = userName.substring(app.state.username.length+1)
				} else {
					a[i].workername = userName.substring(userName.indexOf('.')+1)
				}
			})
		}
	
		if (app.layout.current) {
			app.layout.current.onStateChanged(app.state, app.workers)
		} else {
			console.log('*** No current layout')
		}
	})
}

app.layout = {}

app.layout.base = {
	name: null,
	activate: function()
	{			
		var self = this
		return app.trace('app.layout.base.activate()', function()
		{	  
			if (app.layout.current != self)
			{				
				prev = app.layout.current
				if (prev)	{
					console.log('Adding StartHidden to #tab-' + prev.name + '-layout')
					$('#tab-' + prev.name + '-layout').removeClass('StartVisible').addClass('StartHidden')
					prev.onDeactivated()
				}
				console.log('Removing StartHidden from #tab-' + self.name + '-layout')
				$('#tab-' + self.name + '-layout').removeClass('StartHidden').addClass('StartVisible')
				app.layout.current = self
				app.layout.current.onActivated()
				app.onStateChanged()
			}
		})
	},
	onDeactivated: function()
	{
	},
	onActivated: function()
	{
	},
	onResized: function()
	{
	},
	onStateChanged: function(state, workers)
	{
	},
}

app.layout.vertical = $.extend($.extend({}, app.layout.base), {
	name: 'vertical',
	fillValue: function(name, value, fractionDigits)
	{
		if (value) {
			if (fractionDigits != null)
				value = value.toFixed(fractionDigits)
			document.getElementById(name).innerHTML = value.toString()
		} else {
			document.getElementById(name).innerHTML = 'n/a'
		}							
	},
	onStateChanged: function(state, workers)
	{
		var self = this
		return app.trace('app.layout.vertical.onStateChanged()', function()
		{
			self.fillValue('Difficulty', app.difficulty, 0)
			self.fillValue('Balance', state.balance, 8)
			self.fillValue('Hashrate', state.hashrate, null)
			self.fillValue('Sharerate', state.sharerate, 2)
			var winfo = ''
			if (state && workers) {			
				winfo += '<ul class="fa-ul">'
				workers.forEach(function(worker) {
					winfo += '<li><i class="fa-li fa fa-tasks"></i> <span>'+ worker.workername + ':&nbsp;' + worker.hashrate.toString() + '</span></li>' 
				})
				if (app.errCount) {
					winfo += '<li><i class="fa-li fa fa-warning"></i> <span>Errors:&nbsp;' + app.errCount + '</span></li>'
				}
				winfo += '</ul>'
			} else {
				winfo += '<ul class="fa-ul">'
				winfo += '<li><i class="fa-li fa fa-spin"></i> <span>Updating</span></li>'
				winfo += '</ul>'
			}
			document.getElementById('Workers').innerHTML = winfo;
		})
	},
})

app.layout.settings = $.extend($.extend({}, app.layout.base), {
	name: 'settings',
	onDeactivated: function()
	{
		var self = this
		return app.trace('app.layout.settings.onDeactivated()', function()
		{	  
			app.config.activateConfig({
				url: document.getElementById('inputApiUrl').value,
				username: document.getElementById('inputUserId').value,
				apikey: document.getElementById('inputApiKey').value,
				interval: 5000,
			})
		})
	},
	onActivated: function()
	{
		var self = this
		return app.trace('app.layout.settings.onActivated()', function()
		{	  
			Overwolf.window.resizeTo(Math.max(Overwolf.window.outerWidth,380), Math.max(Overwolf.window.outerHeight,500))
			document.getElementById('inputApiUrl').value = app.config.active.url
			document.getElementById('inputUserId').value = app.config.active.username 
			document.getElementById('inputApiKey').value = app.config.active.apikey
		})
	},	
})

app.layout.about = $.extend($.extend({}, app.layout.base), {
	name: 'about',
	onActivated: function()
	{
		var self = this
		return app.trace('app.layout.about.onActivated()', function()
		{	  
			Overwolf.window.resizeTo(Math.max(Overwolf.window.outerWidth,380), Math.max(Overwolf.window.outerHeight,500))
		})
	},
})

app.layout.current = null

app.layout.all = new Array(
	app.layout.vertical,
	app.layout.settings,
	app.layout.about
)

app.debug = {}

app.debug.logWindowParams = function()
{
	try
	{
		console.log(JSON.stringify({			
			X: Overwolf.window.screenX,
	        Y: Overwolf.window.screenY,
	        W: Overwolf.window.outerWidth,
	        H: Overwolf.window.outerHeight,
		}))
	} catch(e)
	{
		console.log(e)
	}
}

app.tracer = {}

app.tracer.debug = function(name, cb)
{
	console.log('--> ' + name)
	try {
		result = cb()
		console.log('<-- ' + name)
		return result
	}
	catch(e) {
		console.log('ERR ' + e)
		console.log('<-- ' + name)
		throw e
	}
}

app.tracer.release = function(name, cb)
{
	return cb()
}

app.trace = app.tracer.release
