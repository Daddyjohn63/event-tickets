<?php
/**
 * Block: Attendees List
 * Description
 *
 * Override this template in your own theme by creating a file at:
 * [your-theme]/tribe/tickets/blocks/attendees/description.php
 *
 * See more documentation about our Blocks Editor templating system.
 *
 * @link {INSERT_ARTCILE_LINK_HERE}
 *
 * @version 4.9.2
 *
 */
$display_subtitle = $this->attr( 'displaySubtitle' );

if ( is_bool( $display_subtitle ) && ! $display_subtitle ) {
	return;
}

$post_id         = $this->get( 'post_id' );
$attendees_total = count( $attendees );
$message         = _n( 'One person is attending %2$s', '%d people are attending %s', $attendees_total, 'events-gutenberg' );
?>
<p><?php echo esc_html( sprintf( $message, $attendees_total, get_the_title( $post_id ) ) ); ?></p>