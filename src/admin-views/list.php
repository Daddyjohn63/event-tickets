<?php if ( ! defined( 'DOING_AJAX' ) || ! DOING_AJAX ) : ?>
<div id="ticket_list_wrapper">
<?php endif; ?>
	<table id="tribe_ticket_list_table" class="eventtable ticket_list eventForm wp-list-table widefat fixed">
		<?php
		global $post;
		$provider = null;
		$post_type = 'post';

		if ( $post ) {
			$post_id = get_the_ID();
			$post_type = $post->post_type;
		} else {
			$post_id = $_POST['post_ID'];

			if ( ! empty( $_POST['post_type'] ) ) {
				$post_type = $_POST['post_type'];
			} elseif ( ! empty( $_GET['post_type'] ) ) {
				$post_type = $_GET['post_type'];
			}
		}

		$modules = Tribe__Tickets__Tickets::modules();
		?>
		<thead>
			<tr class="table-header">
				<th class="ticket_name"><?php esc_html_e( 'Tickets', 'event-tickets' ); ?></th>
				<?php
				/**
				 * Allows for the insertion of additional columns into the ticket table header
				 *
				 * @since TBD
				 */
				do_action( 'tribe_events_tickets_ticket_table_add_header_column' );
				?>
				<th class="ticket_capacity"><?php esc_html_e( 'Capacity', 'event-tickets' ); ?></th>
				<th class="ticket_available"><?php esc_html_e( 'Available', 'event-tickets' ); ?></th>
				<th class="ticket_edit"></th>
			</th>
		</thead>
		<?php

		foreach ( $tickets as $key => $ticket ) {
			if ( strpos( $ticket->provider_class, 'RSVP' ) !== false ) {
				$rsvp[] = $ticket;
				unset( $tickets[ $key ] );
				continue;
			}
		}

		$tickets = Tribe__Tickets__Tickets_Handler::instance()->sort_tickets_by_menu_order( $tickets );

		?>
		<tbody>
			<?php
			if ( ! empty( $tickets ) ) {
				foreach ( $tickets as $ticket ) {
					Tribe__Tickets__Tickets_Handler::instance()->render_ticket_row( $ticket );
				}
			}

			if ( ! empty( $rsvp ) ) {
				foreach ( $rsvp as $ticket ) {
					Tribe__Tickets__Tickets_Handler::instance()->render_ticket_row( $ticket );
				}
			}
			?>
		</tbody>
	</table>
	<?php do_action( 'tribe_ticket_order_field', $post_id );

	if ( ! defined( 'DOING_AJAX' ) || ! DOING_AJAX ) : ?>
</div>
<?php
endif;
