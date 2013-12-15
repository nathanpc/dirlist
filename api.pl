#!/usr/bin/perl -w

# dirlist+
# A fully-featured directory listing web application.

use strict;
use warnings;
use Data::Dumper;

use Mojolicious::Lite;

# /list?path={path}
get "/list" => sub {
	my $self = shift;
	my $path = $self->param("path");
	my $response;

	if ((!defined($path)) or ($path eq "")) {
		$response = {
			"error" => "No path specified."
		};
	} else {
		$response = {
			"test" => "hello world!"
		};
	}

	# Reply with the JSON.
	$self->render(json => $response);
};

# Start the web app.
app->start();
