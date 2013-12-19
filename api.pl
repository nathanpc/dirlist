#!/usr/bin/perl -w

# dirlist+
# A fully-featured directory listing web application.

use strict;
use warnings;
use File::Find;
use MIME::Base64 qw(encode_base64);

use Data::Dumper;
use Mojolicious::Lite;
use YAML::Tiny;
use URI::Escape;
use File::Path::Expand;
use File::MimeInfo;
use Image::Magick;
use File::Slurp;

# Load settings.
my $settings = YAML::Tiny->read("settings.yml");
if (!defined($settings)) {
	die YAML::Tiny->errstr;
} else {
	$settings = $settings->[0];
}

# Generates a Base64-encoded thumbnail.
sub generate_thumbnail {
	my ($mime, $id, $full_path) = @_;
	if ($mime =~ /(image|video)/i) {
		my $filename = "/tmp/dirlist_" . $id . ".png";

		# Create the cache file if it doesn't exist.
		unless (-e $filename) {
			my $image = Image::Magick->new();

			if ($mime =~ /image/i) {
				# Image thumbnail.
				print "Generating a thumbnail for the image: $full_path\n";
				$image->Read($full_path);
			} elsif ($mime =~ /video/i) {
				my $duration = 20;
				my $tempfile = "/tmp/avconv_thumb_" . $id . ".jpg";

				# Make sure the path doesn't contain any special characters that could be interpreted by the shell command.
				my $safe_path = $full_path;
				$safe_path =~ s/\$/\\\$/gi;
				$safe_path =~ s/\%/\\\%/gi;

				print "Generating a thumbnail for the video: $full_path\n";

				my $status = system("avconv -i \"$safe_path\" -y -ss $duration -an -f image2 -vframes 1 '$tempfile' -loglevel quiet");
				if ($status != 0) {
					print "[ERROR] Couldn't generate thumbnail for '$full_path'\n";
					return undef;
				}

				$image->Read($tempfile);
				unlink($tempfile);
			}

			# Scale image to a thumbnail.
			$image->Scale("200x200");

			# Creating a temp file.
			$image->Write(filename => $filename);
		}

		# Get image data.
		my $image_data = read_file($filename, binmode => ":raw");

		# Base64 the data.
		return "data:image/png;base64," . encode_base64($image_data);
	}
}

# Checks if a parameter was defined.
sub param_defined {
	my ($param) = @_;

	if ((!defined($param)) or ($param eq "")) {
		return 1;
	}

	return 0;
}

# Builds a file path.
sub build_path {
	my ($root_name, $path) = @_;
	my $root = $settings->{"roots"}->{$root_name}->{"path"}->{"system"};

	# Removes the / in the end of the root path if it exists.
	$root =~ s/\/$//;

	return $root . $path;
}

# Builds a URL to the file hosted in the web server.
sub build_url {
	my ($self, $root_name, $path, $file) = @_;
	my $base = $self->req->url->base;
	my $url = $base->scheme . "://" . $base->host;

	my $root = $settings->{"roots"}->{$root_name}->{"path"}->{"web"};
	$root =~ s/\/$//; # Removes the / in the end of the root path.
	$url .= $root;

	my @parts = split("/", $path);
	foreach (@parts) {
		uri_escape($_);
	}
	$url .= join("/", @parts);
	$url .= "/" . uri_escape("$file");

	return $url;
}

# Build a item ID.
sub build_ids {
	my @contents = @_;
	my @ids;

	foreach my $item (@contents) {
		$item =~ s/("|'|\.|\$|\s)/_/gi;
		push(@ids, $item);
	}

	return @ids;
}

# Builds a hash with the response to a list request.
sub list_dir {
	my ($self, $root_name, $path) = @_;

	# Get directory contents.
	my $root = expand_filename(build_path($root_name, $path));
	my @contents;
	opendir(my $dir, $root) or die "Couldn't open $root: $!";
	while (my $item = readdir($dir)) {
		# Ignore hidden directories.
		next if ($item =~ /^\./);
		push(@contents, $item);
	}
	closedir($dir);

	my @ids = build_ids(@contents);
	my $dirlist = {};

	# Get information on each item.
	for (my $i = 0; $i < $#contents + 1; $i++) {
		my $full_path = $root . $contents[$i];
		if (!($root =~ /\/$/)) {
			$full_path = $root . "/" . $contents[$i];
		}

		# Set name.
		$dirlist->{$ids[$i]}->{"name"} = $contents[$i];

		# Get type.
		if (-d $full_path) {
			$dirlist->{$ids[$i]}->{"type"} = "directory";

			# Get size. (http://www.perlmonks.org/?node_id=168974)
			my $size = 0;
			find(sub { $size += -s if -f $_ }, $full_path);
			$dirlist->{$ids[$i]}->{"size"} = $size;
		} else {
			# Get the file type from the MIME.
			$dirlist->{$ids[$i]}->{"type"} = "file";
			my $mime = mimetype($full_path);
			if (defined($mime)) {
				# Get the first part of the MIME Type.
				$dirlist->{$ids[$i]}->{"type"} = (split("/", $mime))[0];
			}

			# Get a thumbnail.
			my $thumbnail = generate_thumbnail($mime, $ids[$i], $full_path);
			if (defined($thumbnail)) {
				$dirlist->{$ids[$i]}->{"thumbnail"} = $thumbnail;
			}

			# Get size.
			$dirlist->{$ids[$i]}->{"size"} = -s $full_path;
		}

		# Get URL.
		$dirlist->{$ids[$i]}->{"href"} = build_url($self, $root_name, $path, $contents[$i]);
	}

	return {
		"ids" => \@ids,
		"contents" => $dirlist
	};
}

# List everything in the directory.
get "/list" => sub {
	my $self = shift;
	my $path = $self->param("path");
	my $root_name = $self->param("root");
	my $response = {};

	# Check for parameters.
	if (param_defined($path)) {
		# Check for path.
		$response = {
			"error" => "No path specified."
		};
	} elsif (param_defined($root_name)) {
		# Check for the root name.
		$response = {
			"error" => "No root name specified."
		};
	} else {
		$response = list_dir($self, $root_name, $path);
	}

	# Reply with the JSON.
	$self->render(json => $response);
};

# List the Roots.
get "/roots" => sub {
	my $self = shift;
	my @roots = keys($settings->{"roots"});

	$self->render(json => {
		"roots" => \@roots
	});
};

# The webapp itself.
any "/" => sub {
	my $self = shift;
	$self->render("index");
};

# Start the web app.
app->start();
