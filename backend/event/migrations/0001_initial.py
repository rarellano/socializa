# -*- coding: utf-8 -*-
# Generated by Django 1.10.2 on 2016-10-05 06:34
from __future__ import unicode_literals

from decimal import Decimal
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('world', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, max_length=200, null=True)),
                ('start_date', models.DateTimeField(blank=True, null=True)),
                ('end_date', models.DateTimeField(blank=True, null=True)),
                ('max_players', models.PositiveIntegerField(default=10)),
                ('price', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=5)),
                ('world', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='world', to='world.WorldBorder')),
            ],
        ),
    ]
