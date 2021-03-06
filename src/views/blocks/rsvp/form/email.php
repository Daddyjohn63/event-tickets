<?php
/**
 * Block: RSVP
 * Form Email
 *
 * Override this template in your own theme by creating a file at:
 * [your-theme]/tribe/tickets/blocks/rsvp/form/email.php
 *
 * See more documentation about our Blocks Editor templating system.
 *
 * @link {INSERT_ARTCILE_LINK_HERE}
 *
 * @version 4.9
 *
 */
/**
 * Set the default value for the email on the RSVP form.
 *
 * @param string
 * @param Tribe__Events_Gutenberg__Template $this
 *
 * @since 4.9
 *
 */
$email = apply_filters( 'tribe_tickets_rsvp_form_email', '', $this );
?>
<input
	type="email"
	name="attendee[email]"
	class="tribe-tickets-email"
	placeholder="<?php esc_attr_e( 'Email', 'events-gutenberg' ); ?>"
	value="<?php echo esc_attr( $email ); ?>"
	required
/>