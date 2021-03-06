from django.utils import timezone

from clue.views import attach_clue
from player.utils import create_random_player
from .models import Event
from .models import Membership


def manage_ia():
    now = timezone.now()
    for event in Event.objects.filter(start_date__gte=now, end_date__lt=now):
        if event.place is None:
            continue
        total_need_players = event.game.challenges.count()
        current_players = event.players.all()
        need_player = total_need_players - current_players
        if need_player < 0:  # Removed some IAs
            assert "Not work OK. When enter new player, this should sustitute IA"
        elif need_player > 0:  # Add some IAs
            while need_player >= 0:
                player = create_random_player(event)
                member = Membership(player=player, event=event)
                member.save()
                attach_clue(player=player, game=event.game, main=True)
                need_player -= 1
