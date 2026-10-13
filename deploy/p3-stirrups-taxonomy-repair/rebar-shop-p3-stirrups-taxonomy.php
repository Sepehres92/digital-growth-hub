<?php
/**
 * Plugin Name: REBAR SHOP P3 Stirrups Taxonomy Consolidation
 * Description: Redirects the retired duplicate Stirrups category to the primary category and normalizes generated term links.
 * Version: 2026.10.13.1
 */

defined( 'ABSPATH' ) || exit;

function rebar_p3_primary_stirrups_url() {
	return home_url( '/product-category/rebar-products/prefabricated-rebars/stirrups/' );
}

function rebar_p3_redirect_duplicate_stirrups() {
	if ( is_tax( 'product_cat' ) && 572 === (int) get_queried_object_id() ) {
		wp_safe_redirect( rebar_p3_primary_stirrups_url(), 301, 'REBAR SHOP P3 taxonomy consolidation' );
		exit;
	}
}
add_action( 'template_redirect', 'rebar_p3_redirect_duplicate_stirrups', -100000 );

function rebar_p3_stirrups_term_link( $termlink, $term, $taxonomy ) {
	if ( 'product_cat' === $taxonomy && $term instanceof WP_Term && 572 === (int) $term->term_id ) {
		return rebar_p3_primary_stirrups_url();
	}

	return $termlink;
}
add_filter( 'term_link', 'rebar_p3_stirrups_term_link', 100, 3 );
