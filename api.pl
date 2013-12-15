#!/usr/bin/perl -w

# dirlist+
# A fully-featured directory listing web application.

use strict;
use warnings;
use Data::Dumper;

use Mojolicious::Lite;
use YAML::Tiny;

# Checks if a parameter was defined.
sub param_defined {
	my ($param) = @_;

	if ((!defined($param)) or ($param eq "")) {
		return 1;
	}

	return 0;
}	

# List everything in the directory.
get "/list" => sub {
	my $self = shift;
	my $path = $self->param("path");
	my $root_name = $self->param("root");

	# Check for parameters.
	if (param_defined($path)) {
		# Check for path.
		$self->render(json => {
			"error" => "No path specified."
		});
	} elsif (param_defined($root_name)) {
		# Check for the root name.
		$self->render(json => {
			"error" => "No root name specified."
		});
	}

	my $response = {
		"test" => "hello world!"
	};

	# Reply with the JSON.
	$self->render(json => $response);
};

# Start the web app.
app->start();
