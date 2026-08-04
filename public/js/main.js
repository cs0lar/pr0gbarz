class Pr0gBarz {
	constructor() {
		this.barz = {}
		this.init()
	}

	init() {
		const self = this
		window.onload = () => {
			// add handlers for bar update buttons
			var incr = document.querySelectorAll("[id^='prog-incr']")
			incr.forEach( (e) => {
				e.onclick = (event) => {
					// TODO: make sure all future buttons get the listener attached
					const row = e.closest("div[id^='prog-row-']")
					const rowId = row.id.substring('prog-row-'.length)
					const selector = `#prog-progress-${rowId}`
					const value = parseInt(e.id.substring('prog-incr'.length))
					self.increment(selector, value, rowId)
				}
			} )
			// add handler for add-new-task button
			document.querySelector('#prog-add').onclick = (event) => {
				var taskName = prompt('Enter task: ')
				const projectId = document.querySelector(".selected").getAttribute('data-project')
				return self.task(taskName, projectId)
			}
			// add handler for add-new-project button
			document.querySelector('#prog-project-add').onclick = (event) => {
				var projName = prompt('Enter project: ')
				var projDuration = prompt('Enter project duration in days: ')
				projDuration = parseInt(projDuration) || 0
				return self.project(projName, projDuration)
			}
			// create and add all the bars in the DOM
			var containers = document.querySelectorAll("[id^='prog-progress-']")
			containers.forEach( (e) => {
				self.add(`#${e.id}`, e.getAttribute('data-progress'))
			} )
			// create and add the duration bar in the DOM
			var duration = document.querySelector('#prog-duration')
			if (duration) {
				self.duration(`#${duration.id}`, duration.getAttribute('data-duration'), duration.getAttribute('data-elapsed'))
			}
			// task delete handler
			var remove = document.querySelectorAll("[id^='prog-remove-']")
			remove.forEach( (e) => {
				e.onclick = (event) => {
					var taskId = e.getAttribute('data-task')
					const projectId = document.querySelector(".selected").getAttribute('data-project')
					return self.remove(taskId, projectId)
				}
			} )
			// project archive handler
			var archive = document.querySelectorAll("[id^='prog-archive-']")
			archive.forEach( (e) => {
				e.onclick = (event) => {
					var projectId = e.getAttribute('data-project')
					var confirmation = confirm('Are you sure you want to archive this Project?')
					if (confirmation == true)
						return self.archive(projectId)
				}
			} )
			// task name edit handler
			var editable = document.querySelectorAll('.editable')
			editable.forEach( (e) => {
				e.onblur = (event) => {
					var taskId   = e.getAttribute('data-task')
					var taskName = e.textContent
					return self.update(taskId, taskName)
				}
			} )
			// project name edit handler
			var editableProj = document.querySelectorAll('.proj-editable')
			editableProj.forEach( (e) => {
				e.onblur = (event) => {
					var projId   = e.getAttribute('data-project')
					var projName = e.textContent
					return self.projectUpdate(projId, projName)
				}
			} )
			// initialise sparklines
			var sparklines = document.querySelectorAll('.sparkline')
			sparklines.forEach( (s) => {
				var data = s.getAttribute('data-rates')
				if (data != '')
					data = data.split(',').map( x => parseFloat(x) )
				sparkline.sparkline(s, data, {interactive: true});
			} )
		}
	}

	remove(taskId, projectId) {
		const url  = '/tasks/remove'
		const params = {
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				'task_id': taskId
			}),
			method: 'POST'
		}

		fetch(url, params)
		.then( (data) => { return data.json() } )
		.then( (res) => {
			if (res.hasOwnProperty('msg') && res.msg == 'OK')
				window.location.href = `/${projectId}`
		} )
		.catch( (err) => {
			console.log(err)
		} )
	}

	archive(projectId) {
		const url = '/projects/update'
		const params = {
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				'project_id': projectId,
				'is_active' : 0
			}),
			method: 'POST'
		}

		fetch(url, params)
		.then( (data) => { return data.json() } )
		.then( (res) => {
			if (res.hasOwnProperty('msg') && res.msg == 'OK')
				window.location.href = '/'
		} )
		.catch( (err) => {
			console.log(err)
		} )
	}

	task(taskName, project) {
		// save the task
		const url = '/tasks/add'
		const params = {
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				'task_name':  taskName,
				'project_id': project
			}),
			method: 'POST'
		}
		fetch(url, params)
		.then( (data) => { return data.json() } )
		.then( (res) => {
			if (res.hasOwnProperty('msg') && res.msg == 'OK')
				window.location.href = `/${project}`
		} )
		.catch( (err) => {
			console.log(err)
		} )
	}

	project(projName, projDuration) {
		// save the new project
		const url = '/projects/add'
		const params = {
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				'project_name': projName,
				'project_duration': projDuration
			}),
			method: 'POST'
		}
		fetch(url, params)
		.then( (data) => { return data.json() } )
		.then( (res) => {
			if (res.hasOwnProperty('msg') && res.msg == 'OK')
				window.location.href = '/'
		} )
		.catch( (err) => {
			console.log(err)
		} )
	}

	add(selector, value) {
		var bar = new ProgressBar.Line(selector, {
			strokeWidth: 4,
		  	easing: 'easeInOut',
		  	duration: 1400,
		  	color: '#FFEA82',
		  	trailColor: '#eee',
		  	trailWidth: 1,
		  	svgStyle: {width: '100%', height: '5%'},
		  	text: {
		    	style: {
			      	// Text color.
			      	// Default: same as stroke color (options.color)
			      	color: '#999',
			      	right: '0',
			      	top: '30px',
			      	padding: 0,
			      	margin: 0,
			      	transform: null
		    	},
		    	autoStyleContainer: false
		  	},
		  	from: {color: '#FFEA82'},
		  	to: {color: '#ED6A5A'},
		  	step: (state, bar) => {
		    	bar.setText(Math.round(bar.value() * 100) + ' %');
		  	}
		})
		bar.animate(value * 0.01);
		this.barz[selector] = {bar: bar, value: value * 0.01}
	}

	duration(selector, duration, elapsed) {

		var bar = new ProgressBar.SemiCircle(selector, {
		  	strokeWidth: 6,
			color: '#FFEA82',
		    trailColor: '#eee',
		    trailWidth: 1,
		    easing: 'easeInOut',
		    duration: 1400,
		    svgStyle: null,
		    text: {
		    	value: '',
		    	alignToBottom: true
		  	},
		  	from: {color: '#FFEA82'},
		  	to: {color: '#ED6A5A'},
		  	// Set default step function for all animate calls
		  	step: (state, bar) => {
    			bar.path.setAttribute('stroke', state.color);
    			var value = Math.round(bar.value() * 100);
    			if (value === 0) {
      				bar.setText('');
    			} else {
      			bar.setText(Math.min(value, 100) + '%');
    			}
    			bar.text.style.color = state.color;
    		}
		})
		bar.text.style.fontSize   = '3rem';
		bar.text.style.fontStyle  = 'italic';
		bar.text.style.fontWeight = 'bold';

		bar.animate(Math.min(elapsed, duration)/duration);
	}

	increment(selector, percent, taskId) {
		const bar = this.barz[selector].bar
		if (bar) {
			var value = parseFloat(this.barz[selector].value) + parseFloat(percent)*0.01
			value = Math.round(value * 100)/100

			if (value >= 0.0 && value <= 1.0) {
				bar.set(value)
				this.barz[selector].value = value
				// persist the update
				const url = '/tasks/update'
				const params = {
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						'task_progress': Math.round(value * 100),
						'task_id': taskId
					}),
					method: 'POST'
				}
				fetch(url, params)
				.then( (data) => { return data.json() } )
				.then( (res) => {} )
				.catch( (err) => {
					console.log(err)
				} )
			}
		}
	}

	update(taskId, taskName) {
		const url = '/tasks/update'
		const params = {
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				'task_id': taskId,
				'task_name': taskName
			}),
			method: 'POST'
		}
		fetch(url, params)
		.then( (data) => { return data.json() } )
		.then( (res) => { } )
		.catch( (err) => {
			console.log(err)
		} )
	}

	projectUpdate(projId, projName) {
		const url = '/projects/update'
		const params = {
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				'project_id': projId,
				'project_name': projName
			}),
			method: 'POST'
		}
		fetch(url, params)
		.then( (data) => { return data.json() } )
		.then( (res) => { })
		.catch( (err) => {
			console.log(err)
		} )
	}

	openNav() {
		document.getElementById('prog-projects-sidenav').style.width = '300px'
	}

	closeNav() {
		document.getElementById('prog-projects-sidenav').style.width = '0px'
	}
}

const Pr0gBarzApp = new Pr0gBarz()
