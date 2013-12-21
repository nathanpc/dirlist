#!/usr/bin/perl -w

# FileHelper.pm
# A helper class to extract data from files.

package FileHelper;

use strict;
use warnings;
use MIME::Base64 qw(encode_base64);
use Scalar::Util qw(looks_like_number);
use POSIX;

use Data::Dumper;
use File::Slurp;
use Image::Magick;
use Image::EXIF;
use PHP::Strings qw(addcslashes);
use String::Util qw(trim);

# Make sure the path doesn't contain any special characters that could be interpreted by the shell command.
sub safe_path {
	my ($path) = @_;

	return addcslashes($path, '\$');
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
				my $safe_path = safe_path($full_path);

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
	} elsif ($mime =~ /video/i) {
		# Extract any data from the video.
		my $safe_path = safe_path($full_path);
		my $output = `mplayer -identify -frames 0 -vo null -ao null -nosound -nolirc "$safe_path"`;

		# Go through each line and check if it's important.
		my @lines = split("\n", $output);
		my $movie_info;
		my $specs;

		foreach my $line (@lines) {
			if ($line =~ /ID_(VIDEO|LENGTH)[\w]*=(.+)/) {
				# Video specs.
				if ($line !~ /(ID_VIDEO_ASPECT|ID_VIDEO_ID)/) {
					# Remove the parts that we don't want.
					$line =~ s/ID_//;
					$line =~ s/VIDEO_//;
					my ($key, $value) = split("=", $line);

					# Prettify the key.
					$key = ucfirst(lc($key));
					if ($key =~ /FPS/i) {
						$key = uc($key);
					}

					# Convert the length from decimal seconds to a human-friendly format.
					if ($key =~ /Length/i) {
						my $min = floor($value / 60);
						my $sec = floor(($value - floor($value)) * 60);

						$value = "$min minutes and $sec seconds";
					}

					# Add it to the spec hash.
					if (looks_like_number($value)) {
						# Convert to number.
						$specs->{$key} = $value + 0;
					} else {
						# Just add it.
						$specs->{$key} = $value;
					}
				}
			} elsif ($line =~ /^\s[\w]+:(.+)$/) {
				# General ID3-like video tags.
				my ($key, $value) = split(": ", trim($line));

				# Ignore the useless tags.
				if ($key !~ /version|brand(s)?/i) {
					# Prettify the key.
					$key = join(" ", map(ucfirst, split("_", $key)));
					$movie_info->{$key} = $value;
				}
			} elsif ($line =~ /^=+/) {
				# We don't care about anything after this point.
				last;
			}
		}

		return {
			"general" => $movie_info,
			"specifications" => $specs
		};
	}

	return undef;
}

1;
