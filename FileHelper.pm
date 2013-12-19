#!/usr/bin/perl -w

# FileHelper.pm
# A helper class to extract data from files.

package FileHelper;

use strict;
use warnings;
use MIME::Base64 qw(encode_base64);

use File::Slurp;
use Image::Magick;
use Image::EXIF;

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

	return undef;
}

# Get extra data from the file.
sub get_extra_data {
	my ($mime, $full_path) = @_;

	if ($mime =~ /image\/jpeg/i) {
		# Extract EXIF data from the image.
		my $exif = Image::EXIF->new($full_path);
		return $exif->get_all_info();
	}

	return undef;
}

1;
