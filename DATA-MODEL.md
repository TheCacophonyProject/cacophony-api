# Data Model

This document gives an introduction to the data model used underneath
the Cacophony API. It is intended to help new developers understand
how the API server works, but might also be useful to consumers of the
API.


## Overview

The following diagram shows the most important parts of the data
model.

```
       .---------------.
       |     Group     |
       | - id          |
       | - groupname   |
       '---------------'
               |
               | has many
               v
       .---------------.
       |    Device     |
       | - name        |
       | - id          |
       '---------------'
               |
               | has many
               v
   .-----------------------.
   |       Recording       |
   | - id                  |
   | - type                |
   | - recordingDateTime   |
   | - location            |
   | - fileKey             |
   | - duration            |
   | - processingState     |
   '-----------------------'
               |
               | has many
               v
    .---------------------.
    |         Tag         |
    | - id                |
    | - what              |
    | - detail            |
    | - confidence        |
    | - startTime         |
    | - duration          |
    | - automatic         |
    | - taggerId          |
    '---------------------'
```

## Group

A "group" is used to keep related devices together for the purposes of
management and querying.

## Device

A "device" represents a single mobile phone running the Cacophonmeter
software or thermal camera equipped embedded computer.

## Recording

A "Recording" repesents a single audio or thermal video recording. It
hold metadata about the recording such as its timestamp and
location. The "fileKey" field stores a key into a separate object
store which holds the actual recording content.

A recording may have 0 or more tags.

## Tag

A Tag describes an animal and or event in a recording. It may
optionally include a start time and duration within the recording for
which the tag applies.

The boolean "automatic" field describes whether a tag was
automatically generated or manually entered by a person. Thermal video
uploads are currently automatically tagged by a machine learning model
and these tags are flagged as automatic.

Tags also include rarely used fields for specifying that an animal was
caught in a particular kind of trap. These are documented here.
