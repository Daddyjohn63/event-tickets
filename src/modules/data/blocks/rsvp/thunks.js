/**
 * External dependencies
 */
import moment from 'moment';

/**
 * Internal dependencies
 */
import * as actions from './actions';
import { DEFAULT_STATE } from './reducers/header-image';
import * as utils from '@moderntribe/tickets/data/utils';
import { middlewares } from '@moderntribe/common/store';
import { globals, time, moment as momentUtil } from '@moderntribe/common/utils';

const { request: {
	actions:wpRequestActions
} } = middlewares;

/**
 * @todo: until we can abstract out wpRequest() better, these should remain as a thunk
 */
const METHODS = {
	DELETE: 'DELETE',
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
};

const createOrUpdateRSVP = ( method ) => ( payload ) => ( dispatch ) => {
	const {
		title,
		description,
		capacity,
		notGoingResponses,
		startDateMoment,
		startTime,
		endDateMoment,
		endTime,
	} = payload;

	const startMoment = momentUtil.setTimeInSeconds(
		startDateMoment.clone(),
		time.toSeconds( startTime, time.TIME_FORMAT_HH_MM_SS ),
	);
	const endMoment = momentUtil.setTimeInSeconds(
		endDateMoment.clone(),
		time.toSeconds( endTime, time.TIME_FORMAT_HH_MM_SS ),
	);

	let path = `${ utils.RSVP_POST_TYPE }`;
	const body = {
		title,
		excerpt: description,
		meta: {
			[ utils.KEY_TICKET_CAPACITY ]: capacity,
			[ utils.KEY_TICKET_START_DATE ]: momentUtil.toDateTime( startMoment ),
			[ utils.KEY_TICKET_END_DATE ]: momentUtil.toDateTime( endMoment ),
			[ utils.KEY_TICKET_SHOW_NOT_GOING ]: notGoingResponses,
		},
	};

	if ( method === METHODS.POST ) {
		body.status = 'publish';
		body.meta[ utils.KEY_RSVP_FOR_EVENT ] = `${ payload.postId }`;
		/* This is hardcoded value until we can sort out BE */
		body.meta[ utils.KEY_TICKET_SHOW_DESCRIPTION ] = 'yes';
		/* This is hardcoded value until we can sort out BE */
		body.meta[ utils.KEY_PRICE ] = '0';
	} else if ( method === METHODS.PUT ) {
		path += `/${ payload.id }`;
	}

	const options = {
		path,
		params: {
			method,
			body: JSON.stringify( body ),
		},
		actions: {
			start: () => dispatch( actions.setRSVPIsLoading( true ) ),
			success: ( { body } ) => {
				if ( method === METHODS.POST ) {
					dispatch( actions.createRSVP() );
					dispatch( actions.setRSVPId( body.id ) );
				}
				dispatch( actions.setRSVPDetails( payload ) );
				dispatch( actions.setRSVPHasChanges( false ) );
				dispatch( actions.setRSVPIsLoading( false ) );
			},
			error: () => dispatch( actions.setRSVPIsLoading( false ) ),
		},
	};

	dispatch( wpRequestActions.wpRequest( options ) );
};

export const createRSVP = createOrUpdateRSVP( METHODS.POST );

export const updateRSVP = createOrUpdateRSVP( METHODS.PUT );

export const deleteRSVP = ( id ) => ( dispatch ) => {
	const path = `${ utils.RSVP_POST_TYPE }/${ id }`;
	const options = {
		path,
		params: {
			method: METHODS.DELETE,
		},
	};

	dispatch( wpRequestActions.wpRequest( options ) );
};

export const getRSVP = ( postId, page = 1 ) => ( dispatch ) => {
	const path = `${ utils.RSVP_POST_TYPE }?per_page=100&page=${ page }&context=edit`;

	const options = {
		path,
		params: {
			method: METHODS.GET,
		},
		actions: {
			start: () => dispatch( actions.setRSVPIsLoading( true ) ),
			success: ( { body, headers } ) => {
				const filteredRSVPs = body.filter( ( rsvp ) => (
					rsvp.meta[ utils.KEY_RSVP_FOR_EVENT ] == postId
				) );
				const totalPages = headers.get( 'x-wp-totalpages' );

				if ( filteredRSVPs.length ) {
					/* If RSVP for event exists in fetched data */
					/**
					 * @todo We are currently only fetching the first RSVP.
					 *       If an event has more than 1 RSVP set up from
					 *       the classic editor, only one will be displayed.
					 *       The strategy to handle this is is being worked on.
					 */
					const datePickerFormat = globals.tecDateSettings().datepickerFormat;

					const rsvp = filteredRSVPs[0];
					const { meta = {} } = rsvp;

					const startDateMeta =  meta[ utils.KEY_TICKET_START_DATE ];
					const startMoment = moment( meta[ utils.KEY_TICKET_START_DATE ] );

					// TODO: Remove 100 years after pickers allow blank values
					const endDateMeta = meta[ utils.KEY_TICKET_END_DATE ] || startMoment.clone().add( 100, 'years' );
					const endMoment = moment( endDateMeta );

					const startDateInput = datePickerFormat
						? startMoment.format( momentUtil.toFormat( datePickerFormat ) )
						: momentUtil.toDate( startMoment );
					const endDateInput = datePickerFormat
						? endMoment.format( momentUtil.toFormat( datePickerFormat ) )
						: momentUtil.toDate( endMoment );
					const capacity = meta[ utils.KEY_TICKET_CAPACITY ] >= 0
						? meta[ utils.KEY_TICKET_CAPACITY ]
						: '';
					const notGoingResponses = meta[ utils.KEY_TICKET_SHOW_NOT_GOING ];

					dispatch( actions.createRSVP() );
					dispatch( actions.setRSVPId( rsvp.id ) );
					dispatch(
						actions.setRSVPGoingCount(
							parseInt( meta[ utils.KEY_TICKET_GOING_COUNT ], 10 ) || 0
						)
					);
					dispatch(
						actions.setRSVPNotGoingCount(
							parseInt( meta[ utils.KEY_TICKET_NOT_GOING_COUNT ], 10 ) || 0
						)
					);
					dispatch( actions.setRSVPDetails( {
						title: rsvp.title.rendered,
						description: rsvp.excerpt.raw,
						capacity,
						notGoingResponses,
						startDate: momentUtil.toDate( startMoment ),
						startDateInput,
						startDateMoment: startMoment.clone().startOf( 'day' ),
						endDate: momentUtil.toDate( endMoment ),
						endDateInput,
						endDateMoment: endMoment.clone().startOf( 'day' ),
						startTime: momentUtil.toDatabaseTime( startMoment ),
						endTime: momentUtil.toDatabaseTime( endMoment ),
					} ) );
					dispatch( actions.setRSVPTempDetails( {
						tempTitle: rsvp.title.rendered,
						tempDescription: rsvp.excerpt.raw,
						tempCapacity: capacity,
						tempNotGoingResponses: notGoingResponses,
						tempStartDate: momentUtil.toDate( startMoment ),
						tempStartDateInput: startDateInput,
						tempStartDateMoment: startMoment.clone().startOf( 'day' ),
						tempEndDate: momentUtil.toDate( endMoment ),
						tempEndDateInput: endDateInput,
						tempEndDateMoment: endMoment.clone().startOf( 'day' ),
						tempStartTime: momentUtil.toDatabaseTime( startMoment ),
						tempEndTime: momentUtil.toDatabaseTime( endMoment ),
					} ) );
					dispatch( actions.setRSVPIsLoading( false ) );
				} else if ( page < totalPages ) {
					/* If there are more pages */
					dispatch( getRSVP( postId, page + 1 ) );
				} else {
					/* Did not find RSVP */
					dispatch( actions.setRSVPIsLoading( false ) );
				}
			},
			error: () => dispatch( actions.setRSVPIsLoading( false ) ),
		},
	};

	dispatch( wpRequestActions.wpRequest( options ) );
};

export const updateRSVPHeaderImage = ( postId, image ) => ( dispatch ) => {
	const path = `tribe_events/${ postId }`;
	const body = {
		meta: {
			[ utils.KEY_TICKET_HEADER ]: `${ image.id }`,
		},
	};

	const options = {
		path,
		params: {
			method: METHODS.PUT,
			body: JSON.stringify( body ),
		},
		actions: {
			start: () => dispatch( actions.setRSVPIsSettingsLoading( true ) ),
			success: () => {
				dispatch( actions.setRSVPHeaderImage( {
					id: image.id,
					alt: image.alt,
					src: image.sizes.medium.url,
				} ) );
				dispatch( actions.setRSVPIsSettingsLoading( false ) );
			},
			error: () => dispatch( actions.setRSVPIsSettingsLoading( false ) ),
		},
	};

	dispatch( wpRequestActions.wpRequest( options ) );
};

export const deleteRSVPHeaderImage = ( postId ) => ( dispatch ) => {
	const path = `tribe_events/${ postId }`;
	const body = {
		meta: {
			[ utils.KEY_TICKET_HEADER ]: null,
		},
	};

	const options = {
		path,
		params: {
			method: METHODS.PUT,
			body: JSON.stringify( body ),
		},
		actions: {
			start: () => dispatch( actions.setRSVPIsSettingsLoading( true ) ),
			success: () => {
				dispatch( actions.setRSVPHeaderImage( {
					id: DEFAULT_STATE.id,
					alt: DEFAULT_STATE.alt,
					src: DEFAULT_STATE.src,
				} ) );
				dispatch( actions.setRSVPIsSettingsLoading( false ) );
			},
			error: () => dispatch( actions.setRSVPIsSettingsLoading( false ) ),
		},
	};

	dispatch( wpRequestActions.wpRequest( options ) );
};

export const getRSVPHeaderImage = ( id ) => ( dispatch ) => {
	const path = `media/${ id }`;

	const options = {
		path,
		params: {
			method: METHODS.GET,
		},
		actions: {
			start: () => dispatch( actions.setRSVPIsSettingsLoading( true ) ),
			success: ( { body } ) => {
				dispatch( actions.setRSVPHeaderImage( {
					id: body.id,
					alt: body.alt_text,
					src: body.media_details.sizes.medium.source_url,
				} ) );
				dispatch( actions.setRSVPIsSettingsLoading( false ) );
			},
			error: () => dispatch( actions.setRSVPIsSettingsLoading( false ) ),
		},
	};

	dispatch( wpRequestActions.wpRequest( options ) );
};
