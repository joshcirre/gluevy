<?php

namespace App;

enum DestinationType: string
{
    case Youtube = 'youtube';
    case Twitch = 'twitch';
    case Facebook = 'facebook';
    case Rtmp = 'rtmp';
}
