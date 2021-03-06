from decimal import Decimal
from django.conf import settings
from django.contrib.gis.db import models
from django.contrib.gis.geos import Point

from game.models import Game
from player.models import Player


class Event(models.Model):
    name = models.CharField(max_length=200, blank=True, null=True)
    place = models.MultiPolygonField(blank=True, null=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    max_players = models.PositiveIntegerField(default=10)
    price = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    game = models.ForeignKey(Game, related_name="events", null=True)
    players = models.ManyToManyField(Player, through="Membership")
    vision_distance = models.PositiveIntegerField(default=settings.DEFAULT_VISION_DISTANCE,
                                                  null=True, blank=True,
                                                  help_text='max vision ditance in m')
    meeting_distance = models.PositiveIntegerField(default=settings.DEFAULT_MEETING_DISTANCE,
                                                   null=True,
                                                   blank=True,
                                                   help_text='max meeting ditance in m')

    def status(self):
        return "[{0}/{1}]".format(self.players.count(), self.max_players)

    def get_max_ratio(self):
        """ Get the bigger distance between center of poly and vertices of poly.
        This distance will be used for create a circle for obtain random coords.
        You should check previously if place is not None. """
        if self.place is None:
            assert "It can't obtain max ratio if place not exist."
        _transform2meter = 100 * 1000
        _center = self.place.centroid
        max_distance = 0
        for _coord in self.place.coords[0][0]:
            _distance = _center.distance(Point(_coord))
            if _distance > max_distance:
                max_distance = _distance
        return max_distance * _transform2meter

    def get_meeting_distance(self):
        return self.meeting_distance if self.meeting_distance else settings.DEFAULT_MEETING_DISTANCE

    def __str__(self):
        return self.name


MEMBERSHIP_STATUS = (
    ('registered', 'registered'),
    ('paying', 'paying'),
    ('payed', 'payed'),
    ('cancelled', 'cancelled'),
    ('solved', 'solved'),
)


class Membership(models.Model):
    player = models.ForeignKey(Player)
    event = models.ForeignKey(Event)
    status = models.CharField(max_length=16, choices=MEMBERSHIP_STATUS, default='registered')

    def __str__(self):
        return "{0} ∈ {1}".format(self.player.user.username, self.event.name)


class PlayingEvent(models.Model):
    player = models.OneToOneField(Player, related_name="playing_event")
    event = models.ForeignKey(Event, blank=True, null=True, related_name="playing_event")
