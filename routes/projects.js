const util = require( 'util' )
const figlet = require( 'figlet' )
const text = util.promisify( figlet.text )
const Utils = require( '../lib/utils' )

async function routes( fastify, options ) {

	fastify.get( '/:projectId', async ( request, reply ) => {
		
		// prep title
		const title = await text( 'pr0gbarz', { font: 'Lean' } )
		// prep tasks list
		let tasks = []
		let projects = []
		let projectId = null
		let ratesByTaskId = {}
		let duration = 0
		let elapsed  = 0

		try {
			// load projects
			let sql  = 'SELECT id, name FROM pgbz_project WHERE is_active=1 ORDER BY name'
			projects = await fastify.db.all( sql, [] ) 
			// check if we have a project Id in the request
			// otherwise load tasks for first project if any
			projectId = parseInt( request.params.projectId ) || projects[ 0 ].id || 0

			if ( projectId ) {
				// TODO: get last selected project from session or db
				sql = 'SELECT t.id, t.name, t.progress, p.duration as proj_duration, p.created_at as proj_created_at FROM pgbz_task t, pgbz_project p, pgbz_project_tasks pt WHERE p.id = pt.project_id AND pt.project_id=? AND t.id = pt.task_id ORDER BY progress DESC'
				tasks = await fastify.db.all( sql, [ projectId ] )
				// compute the progress sparklines
				taskIdsString = tasks.map( ( task ) => task.id ).join( ',' )
				sql = `SELECT * FROM pgbz_progress_time WHERE task_id IN (${taskIdsString}) ORDER BY task_id, t`
				tSeriesData = await fastify.db.all( sql, [] )
				ratesByTaskId = Utils.computeProgressTimeSeries( tSeriesData )
				// compute elapsed project days	
				if ( tasks.length > 0 ) {
					duration = tasks[ 0 ].proj_duration
					if ( duration > 0 ) {
						let d1 = new Date().getTime()
						let d2 = parseFloat( tasks[0].proj_created_at )
						elapsed = ( d1 - d2 ) / ( 1000 * 3600 * 24 ); 
					}
				}
			}
		}
		catch ( err ) {
			fastify.log.error( err ) 
		}
		finally {
			reply.view( 'pr0gbarz.liquid', {
				projects: projects, 
				tasks: tasks, 
				title: title, 
				selected: projectId, 
				rates: ratesByTaskId, 
				proj_duration: duration, 
				proj_elapsed: elapsed 
			} )
		}

		return reply

	} )

	fastify.post( '/projects/add', async ( request, reply ) => {

		// retrieve project name
		const projName     = request.body.project_name
		const projDuration = request.body.project_duration
		const now          = new Date().getTime()
		const sql          = 'INSERT INTO pgbz_project (name, duration, created_at, updated_at) VALUES (?, ?, ?, ?)'

		try {
			await fastify.db.run( sql, [ projName, projDuration, now, now ] )

			reply.code( 201 )
			     .header( 'Content-Type', 'application/json; charset=utf-8' )
			     .send( { msg: 'OK' } )
		}
		catch ( err ) {
			fastify.log.error( err )
			reply.code( 500 )
			     .type( 'text/plain' )
			     .send( err.message )
		}

		return reply

	} )

	fastify.post( '/projects/update', async( request, reply ) => {

		const projectId   = request.body.project_id
		const projectName = request.body.project_name
		const is_active   = request.body.is_active
		const now         = new Date().getTime()
		const targetField = is_active === 0 ? 'is_active' : 'name'
		const target      = is_active === 0 ? is_active : projectName

		const sql = `UPDATE pgbz_project SET ${targetField}=?, updated_at=? WHERE id=?` 

		try {
			await fastify.db.run( sql, [ target, now, projectId ] )
			reply.code( 200 )
			     .header( 'Content-Type', 'application/json; charset=utf-8' )
				 .send( { msg: 'OK' } )
		}
		catch ( err ) {
			fastify.log.error( err )
			reply.code( 500 )
			     .type( 'text/plain' ) 
			     .send( err.message )
		}

		return reply
	
	} )
	
}

module.exports = routes
