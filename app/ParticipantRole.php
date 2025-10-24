<?php

namespace App;

enum ParticipantRole: string
{
    case Host = 'host';
    case Guest = 'guest';
}
