-- One-time cleanup: remove the Takealot deals that had broken URLs.
-- The bot will immediately re-add them with correct links on the next run.
delete from deals where source = 'takealot';
