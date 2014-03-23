
app = window.app = {}

app.nullState = {
	username: 'n/a',
	balance: 0,
	hashrate: 0,
	sharerate: 0,
}

app.states = {}
app.miners = {}
app.errCount = 0

app.localStorage = window.localStorage

app.config1 = {
	key: 'v0.config',
	active: {
		url: 'https://www.ltcrabbit.com/index.php',
		username: '',
		apikey: '',
		interval: 5000,
	}
}

app.config1.load = function()
{
	var self = this
	return app.trace('app.config1.load()', function()
	{	  
		conf = app.localStorage.getItem(app.config1.key)
		if (conf) {
			var config = JSON.parse(conf)
			app.config1.activate(config)
		}
		return app.config1.valid()
	})
}

app.config1.activate = function(conf)
{
	var self = this
	return app.trace('app.config1.activate()', function()
	{	  
		app.config1.active = conf
		
		if (!app.config1.active.url)
			app.config1.active.url = ltcrabbit.address
		app.config1.active.interval = Math.max(app.config1.active.interval, 5000)		
	})
}

app.config1.valid = function()
{
	return (app.config1.active.url && app.config1.active.username && app.config1.active.apikey)
}

app.config2 = {
	key: 'v2.config.rev.1',
	active: null,
	inactive: null,
	schema: { 
		type: 'object',
		name: 'Config',
		description: 'LTCRabbit Monitor Config',
		properties: {
			UpdateInterval: { 
				type: 'integer',
				label: "Update interval (milliseconds)",
				required: true 
			},
			Pool: {
				type: 'object',
				label: "LTCRabbit Public API",
				properties: {
					Address: { 
						type: 'string',
						label: "Address",
						required: true
					},
					Workers: {
						type: "array",
						label: "Accounts",
						description: "You can find your <i>User&nbsp;ID</i> and <i>API&nbsp;Key</i> on the <a href='javascript: window.open(\"https://www.ltcrabbit.com/#afc17o\")'><strong>Account&nbsp;Settings</strong></a> page",
						items: {
							type: "object",    	                
							properties: {
								Disabled: { 
									type: 'boolean',
									label: "Disabled"
								},
								ApiKey: { 
									type: 'string', 
									label: "API Key",
									required: true 
								},
								UserId: { 
									type: 'integer',
									label: "User ID",
									required: true 
								}
							} 
						}
					}					
				}
			},
			Farm: {
				type: 'object',
				label: "CGMiner/BFGMiner API",
				properties: {
					Proxy: { 
						type: 'string',
						label: "Proxy",
						required: false,						
						description: "This monitor doesn't support direct TCP connections to CGMiner/BFGMiner API. However you can use <a href='javascript: window.open(\"https://github.com/TigerND/cgminer2http\")'><strong>cgminer2http</strong></a> proxy to monitor you miners",
					},
					Miners: {
						type: "array",
						label: "Miners",						
						items: {
							type: "object",    	                
							properties: {
								Disabled: { 
									type: 'boolean',
									label: "Disabled"
								},
								Name: { 
									type: "string", 
									required: false 
									},
								Address: { 
									type: "string", 
									required: true 
									},
								Proxy: { 
									type: "string", 
									required: false
									}
								}
							}
						}
					}
				}
			}
    	},
	default: {
		UpdateInterval: 5000,
		Pool: {
			Address: 'https://www.ltcrabbit.com/index.php',
			Workers: [
			    {
			    	Disabled: false,
			    	UserId: 0,
			    	ApiKey: ''
			    }
			]
		},
		Farm: {
			Proxy: 'http://127.0.0.1:4030/',
			Miners: [
			    {
			    	Disabled: true,
			    	Address: '127.0.0.1:4028',
			    }
			]
		}
	},
	valid: function()
	{
		var self = this
		return app.trace('app.config2.valid()', function()
		{
			if (!self.active) {
				console.log("There's no active config")
				return false
			}
			if (!self.active.UpdateInterval) {
				console.log("Update interval has been corrected")
				self.active.UpdateInterval = 5000
			}
			if (!self.active.Pool.Address) {
				console.log("There's no pool address")
				return false
			}
			self.active.Pool.Workers.forEach(function(v) {
				if ((!v.UserId) || (!v.ApiKey)) {
					console.log("Invalid pool account parameters")
					return false
				}
			})
			self.active.Farm.Miners.forEach(function(v) {
				if (!v.Address) {
					console.log("Invalid miner parameters")
					return false
				}
			})
			return true
		})
	},
	load: function()
	{
		var self = this
		return app.trace('app.config2.load()', function()
		{
			conf = app.localStorage.getItem(self.key)
			if (conf) {
				console.log("Loaded: " + conf)
				var config = JSON.parse(conf)
				return self.activate(config)
			}
			return false			
		})
	},
	save: function()
	{
		var self = this
		return app.trace('app.config2.save()', function()
		{	  
			app.localStorage.setItem(self.key, JSON.stringify(self.active))
		})
	},
	activate: function(conf)
	{
		var self = this
		return app.trace('app.config2.activate()', function()
		{	  
			self.inactive = self.active
			self.active = $.extend({}, conf)
			if (self.valid())
			{			
				if (!self.active.Pool.Address) {
					self.active.Pool.Address = ltcrabbit.address									
				}
				self.active.UpdateInterval = Math.max(parseInt(self.active.UpdateInterval), 2000).toString()
				
				ltcrabbit.address = self.active.Pool.Address
				self.save()
			
				app.errCount = 0
				app.states = {}
				app.miners = {}
			
				app.onStateChanged()
				return true;
			} else {			
				self.active = self.inactive
				return false;
			}
		})
	},
	import1: function(conf)
	{
		var self = this
		return app.trace('app.config2.import1()', function()
		{	 
			wr = {}
			wr.UserId = conf.username
			wr.ApiKey = conf.apikey

			cf = $.extend({}, self.default)
			cf.UpdateInterval = conf.interval
			cf.Pool.Address = conf.url
			cf.Pool.Workers = new Array(wr)
			
			console.log('Imported: ' + JSON.stringify(cf))
			
			return self.activate(cf)
		})
	}
}

app.config2.active = $.extend({}, app.config2.default)	

app.forEachMiner = function(miner, handler) {
	for (var k in app.miners) {
		if (app.miners.hasOwnProperty(k)) {
			var info = app.miners[k]
			handler(info)
		}
	}
}

app.start = function()
{
	var self = this
	return app.trace('app.start()', function()
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
	        
	    if (app.config2.load()) {
	    	console.log('Config loaded')
	    } else {
		    if (app.config1.load()) {
		    	if (app.config2.import1(app.config1.active)) {
			    	console.log('Config imported')
		    	}
		    }
	    }
	    
	    if (app.config2.valid()) {
	    	app.layout.vertical.activate()    			    			    	
	    } else {
	    	app.layout.settings.activate()	    	
	    }
	    	    	    
		app.update()
	})
}

app.stateForWorker = function(worker)
{
	if (!app.states.hasOwnProperty(worker.UserId)) {
		app.states[worker.UserId] = {
			state: $.extend({}, app.nullState),
			workers: [],
			errCount: 0,
			firstErrorTime: null
		}
	}
	return app.states[worker.UserId]
}

app.minerStateInfoObject = function(data)
{
	this.requestTime = null
	this.responseTime = null
	this.emptyData = data
	this.data = data
	this.isExpired = function(timeout)
	{		
		if (!this.requestTime)
			return true
		now = new Date().getTime()
		if ((this.responseTime) && (now - timeout > this.responseTime))
			return true
		return false
	}
	this.clear = function()
	{
		this.data = this.emptyData
	}
	this.onRequest = function()
	{
		this.requestTime = new Date().getTime()
	}
	this.onResponse = function(data)
	{
		this.responseTime = new Date().getTime()
		this.data = data
	}
}

app.getMinerState = function(miner)
{
	var id = miner.Address 
	if (!app.miners.hasOwnProperty(id)) {
		app.miners[id] = {
			config: miner,
			summary: new app.minerStateInfoObject({}),
			pools: new app.minerStateInfoObject([]),
			devs: new app.minerStateInfoObject([]),
			errCount: 0,
			firstErrorTime: null
		}
	}
	return app.miners[id]
}

app.cgminerCommand = function(proxy, miner, command, cb, eb)
{
	var data = { 
    	"api": { 
    		"address": miner.config.Address, 
    		"command": command 
    		}
    	}
	console.log('POST: ' + proxy + ': ' + JSON.stringify(data))
	$.ajax({
		type: "POST",
		url: proxy,
	    data: data,
	    dataType: "json",
	}).done(function(data){
		console.log(JSON.stringify(data))
		try {
			if (data.STATUS[0].STATUS == 'S') {
				cb(data)
			} else {
				eb(data.STATUS[0].Msg)
			}
		} catch(err) {
			console.log('Invalid data')
			eb('Invalid data')
		}
	}).fail(function(jqXHR, textStatus){
		console.log(textStatus)
	    eb(textStatus)
	})				
}

app.update = function()
{
	if ((app.config2.active) && (app.config2.active.Pool.Workers))
	{
		app.config2.active.Pool.Workers.forEach(function(v) {
			var worker = v;
			if (!worker.Disabled) {
				var info = app.stateForWorker(worker)
				ltcrabbit.getuserstatus(worker.ApiKey,
					function(state)	{
						info.state = state
						app.onWorkerUpdatePassed(info)
					}, 
					function() {
						app.onWorkerUpdateFailed(info, null)
					}				
				)
				ltcrabbit.getuserworkers(worker.ApiKey, 
					function(workers) {						
						info.workers = workers
						app.onWorkerUpdatePassed(info)
					},
					function()	{						
						app.onWorkerUpdateFailed(info, null)
					}
				)
			}
		})
		var proxy = app.config2.active.Farm.Proxy
		if (proxy) {
			app.config2.active.Farm.Miners.forEach(function(v) {
				var miner = v
				if (!miner.Disabled) {
					var info = app.getMinerState(miner)
					console.log(JSON.stringify(info.summary))
					if (info.summary.isExpired(app.config2.active.UpdateInterval)) {
						info.summary.onRequest()
						app.cgminerCommand(proxy, info, {command: 'summary'}, 
							function(data) {
								info.summary.onResponse(data.SUMMARY[0])
								app.onMinerUpdatePassed(info)					
							}, function (reason) {
								app.onMinerUpdateFailed(info, reason)
							}
						)						
					}
					if (info.pools.isExpired(app.config2.active.UpdateInterval)) {
						info.pools.onRequest()						
						app.cgminerCommand(proxy, info, {command: 'pools'}, 
							function(data) {
								info.pools.onResponse(data.POOLS)
								app.onMinerUpdatePassed(info)					
							}, function (reason) {
								app.onMinerUpdateFailed(info, reason)
							}
						)
					}
					if (info.devs.isExpired(app.config2.active.UpdateInterval)) {
						info.devs.onRequest()						
						app.cgminerCommand(proxy, info, {command: 'devs'}, 
							function(data) {
								info.devs.onResponse(data.DEVS)
								app.onMinerUpdatePassed(info)					
							}, function (reason) {
								app.onMinerUpdateFailed(info, reason)
							}
						)
					}
				}
			})
		}
	}

	setTimeout(app.update, app.config2.active.UpdateInterval)
}

app.onWorkerUpdatePassed = function(worker)
{
	worker.errCount = 0
	worker.firstErrorTime = null
	app.onUpdatePassed()
}

app.onWorkerUpdateFailed = function(worker, reason)
{
	if (worker.errCount == 0) {
		worker.firstErrorTime = new Date().getTime()
	}		
	worker.errCount += 1
	app.onUpdateFailed()
}

app.onMinerUpdatePassed = function(miner)
{
	miner.errCount = 0
	miner.firstErrorTime = null
	app.onUpdatePassed()
}

app.onMinerUpdateFailed = function(miner, reason)
{
	if (miner.errCount == 0) {
		miner.firstErrorTime = new Date().getTime()
	}		
	miner.errCount += 1
	app.onUpdateFailed()
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
		for (var k in app.states) {
			if (app.states.hasOwnProperty(k)) {
				var info = app.states[k]
				if ((info.state) && (info.state.username != undefined))
				{
					if (info.workers) {						
						//console.log(JSON.stringify(info.workers))
						info.workers.forEach(function(v, i, a) {
							//console.log(JSON.stringify(v))
							var userName = v.username
							if (userName.indexOf(info.state.username + '.') == 0) {
								a[i].workername = userName.substring(info.state.username.length+1)
							} else {
								a[i].workername = userName.substring(userName.indexOf('.')+1)
							}
						})
					}
				}			
			}
		}
	
		if (app.layout.current) {
			app.layout.current.onStateChanged()
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
	onStateChanged: function()
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
	onStateChanged: function()
	{
		var self = this
		return app.trace('app.layout.vertical.onStateChanged()', function()
		{
			/**
			 * Summary
			 */
			var balance = 0.0,
			    hashrate = 0,
			    sharerate = 0.0
			var now = new Date().getTime()
			for (var k in app.states) {
				if (app.states.hasOwnProperty(k)) {
					var info = app.states[k]
				    console.log('Info[' + k + ']: ' + JSON.stringify(info))
					balance += info.state.balance
				    hashrate += info.state.hashrate
				    sharerate += info.state.sharerate
				}
			}
			self.fillValue('Balance', balance, 8)
			self.fillValue('Hashrate', hashrate, null)
			self.fillValue('Sharerate', sharerate, 2)
			/**
			 * Workers
			 */
			var winfo = ''
			for (var k in app.states) {
				if (app.states.hasOwnProperty(k)) {
					var info = app.states[k]
					winfo += '<div class="miner-info">'
					winfo += '<table>'
					winfo += '<thead>'
					winfo += '<tr>'
					winfo += '<th>'
					if (info.state && info.state.username) {
						winfo += info.state.username	
					} else {
						winfo += 'Workers'
					}
					winfo += '</th>'
					winfo += '</tr>'
					winfo += '</thead>'
					if (info.state && info.workers) {			
						winfo += '<tr>'
						winfo += '<td>'							
						winfo += '<div class="device-info">'
						winfo += '<table>'						
						info.workers.forEach(function(worker) {
							winfo += '<tr>'
							winfo += '<td align="left"><span class="dev-info-alive">' + worker.workername + '</span></td>'
							winfo += '<td align="right"><span class="dev-info-alive">' + worker.hashrate.toString() + '</span></td>'
							winfo += '</tr> '							
						})
						if ((info.errCount > 0) && (now - info.firstErrorTime > 10000)) {
							winfo += '<tr class="ltcm-note-error">'
							winfo += '<td>'
							winfo += '<i class="fa fa-warning"></i>&nbsp;'
							winfo += 'Errors:&nbsp'
							winfo += info.errCount
							winfo += '</td>'
							winfo += '</tr>'
						}
						winfo += '</table>'
						winfo += '</div>'
						winfo += '</td>'
						winfo += '</tr>'
					}
					winfo += '</table>'
					winfo += '</div>'					
				}
			}
			$('#Workers').html(winfo)
			/**
			 * Miners
			 */
			var minfo = ''
			for (var k in app.miners) {
				if (app.miners.hasOwnProperty(k)) {
					var info = app.miners[k]
					var title = (info.config.Name || info.config.Address)
					console.log('Processing ' + title)
					minfo += '<div class="miner-info">'
					minfo += '<table>'
					minfo += '<thead>'
					minfo += '<tr>'
					minfo += '<th>'
					minfo += title
					minfo += '</th>'
					minfo += '</tr>'
					minfo += '</thead>'
					
					if (info.summary.data) {
						minfo += '<tr>'
						minfo += '<td>'							
							minfo += '<div class="device-info">'
							minfo += '<table>'
								info.devs.data.forEach(function(v) {
									var dev = v
									var cls = 'dev-info-alive'
									if ((dev['Status'] != 'Alive') || (dev["Hardware Errors"] > 0)) {
										var cls = 'dev-info-error'
									}
									minfo += '<tr>'
									minfo += '<td><span class="' + cls + '">' + dev['Temperature'] + '&deg;</legend></span></td>'
									minfo += '<td><span class="' + cls + '">' + dev['Fan Percent'] + '%</span></td>'
									minfo += '<td><span class="' + cls + '">' + (dev['MHS 5s']*1000).toFixed(0) + '</span></td>'
									minfo += '<td><span class="' + cls + '">' + dev['Accepted'] + '/' + dev['Rejected'] + '</span></td>'
									minfo += '</tr> '							
								})
							minfo += '</table>'
							minfo += '</div>'
						minfo += '</td>'
						minfo += '</tr>'
						
						/*
						var pinfo = ''
						info.pools.data.forEach(function(v) {
							var pool = v
							pinfo += '<td>'
							if (pool.Status == 'Alive') {
								pinfo += '<span class="pool-info-accepted">' + pool.Accepted + '</span>'
								if (pool.Rejected > 0) {
									pinfo += '/<span class="pool-info-rejected">' + pool.Rejected + '</span>'
								}
							} else {
								pinfo += '<i class="fa fa-warning pool-info-offline"></i>'							
							}
							pinfo += '</td>'
						})
						if (pinfo) {
							minfo += '<tr>'
							minfo += '<td>'
								minfo += '<div class="pool-info">'
									minfo += '<table>'
									minfo += '<tr>'
									minfo += pinfo
									minfo += '</tr>'
									minfo += '</table>'
								minfo += '</div>'
							minfo += '</td>'
							minfo += '</tr>'
						}
						*/							
					}					
					if ((info.errCount > 0) && (now - info.firstErrorTime > 10000)) {
						minfo += '<tr class="ltcm-note-error">'
						minfo += '<td>'
						minfo += '<i class="fa fa-warning"></i>&nbsp;'
						minfo += 'Errors:&nbsp'
						minfo += info.errCount
						minfo += '</td>'
						minfo += '</tr>'
						info.summary.data = {}
					}
				}
				minfo += '</table>'
				minfo += '</div>'
			}
			$('#Miners').html(minfo)
		})
	}
})

app.layout.settings = $.extend($.extend({}, app.layout.base), {
	name: 'settings',
	ondeSession: null,
	onDeactivated: function()
	{
		var self = this
		return app.trace('app.layout.settings.onDeactivated()', function()
		{	  
			if (self.ondeSession) {
				self.ondeSession = null
			}
			/*
			app.config1.activate({
				url: document.getElementById('inputApiUrl').value,
				username: document.getElementById('inputUserId').value,
				apikey: document.getElementById('inputApiKey').value,
				interval: 5000,
			})
			*/
		})
	},
	onActivated: function()
	{
		var self = this
		return app.trace('app.layout.settings.onActivated()', function()
		{	  
			Overwolf.window.resizeTo(Math.max(Overwolf.window.outerWidth,660), Math.max(Overwolf.window.outerHeight,480))
			/*
			document.getElementById('inputApiUrl').value = app.config1.active.url
			document.getElementById('inputUserId').value = app.config1.active.username 
			document.getElementById('inputApiKey').value = app.config1.active.apikey
			*/
						
			// Instantiate Onde with our form above
			$('#onde-panel').html()
			if (self.ondeSession != undefined && self.ondeSession != null) {
				delete self.ondeSession
			}
			self.ondeSession = new onde.Onde($('#onde-settings-form'))
			  // Render the form with the schema
		    app.config2.inactive = $.extend({}, app.config2.active)  
		    self.ondeSession.render(app.config2.schema, app.config2.inactive, {
		    	collapsedCollapsibles: false
			})				
			  
			// Bind our form's submit event. We use this to get the data out from Onde
			$('#onde-settings-form').submit(function (evt) {
			    evt.preventDefault()
			    if (self.ondeSession) {
				    var outData = self.ondeSession.getData()
				    if (outData.errorCount) {
				        alert("There are " + outData.errorCount + " errors. Check your config")
				    } else {
				        console.log(JSON.stringify(outData.data, null, "  "))
				        app.config2.activate(outData.data)
				        delete self.ondeSession
				        app.layout.vertical.activate()
				    }			    	
			    }
			    return false
			})	    			
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
			Overwolf.window.resizeTo(Math.max(Overwolf.window.outerWidth,500), Math.max(Overwolf.window.outerHeight,520))
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
		console.trace('ERR ' + e)
		console.log('<-- ' + name)
		throw e
	}
}

app.tracer.release = function(name, cb)
{
	return cb()
}

app.trace = app.tracer.release
