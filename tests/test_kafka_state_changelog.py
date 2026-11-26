import copy

import pytest

from backend.app.storage.kafka_state_changelog import KafkaStateChangelog


def make_valid_envelope():
    return KafkaStateChangelog._build_envelope(
        sequence=1,
        snapshot_id='snapshot-test-001',
        records={
            'streamforge:aggregator:windows': {},
            'streamforge:aggregator:watermarks': {},
            'streamforge:aggregator:seen_ids': [],
        },
    )


def test_build_and_validate_snapshot_envelope():
    envelope = make_valid_envelope()

    validated = KafkaStateChangelog._validate_envelope(envelope)

    assert validated == envelope
    assert envelope['schema_version'] == KafkaStateChangelog.SCHEMA_VERSION
    assert envelope['sequence'] == 1
    assert envelope['snapshot_id'] == 'snapshot-test-001'
    assert isinstance(envelope['checksum'], str)
    assert len(envelope['checksum']) == 64


def test_build_envelope_rejects_non_dictionary_records():
    with pytest.raises(TypeError, match='Snapshot records must be a dictionary'):
        KafkaStateChangelog._build_envelope(
            sequence=1,
            snapshot_id='snapshot-test-001',
            records=[],
        )


def test_validate_rejects_missing_required_field():
    envelope = make_valid_envelope()
    del envelope['snapshot_id']

    with pytest.raises(ValueError, match='missing required fields'):
        KafkaStateChangelog._validate_envelope(envelope)


def test_validate_rejects_unsupported_schema_version():
    envelope = make_valid_envelope()
    envelope['schema_version'] = 999

    with pytest.raises(ValueError, match='Unsupported snapshot schema version'):
        KafkaStateChangelog._validate_envelope(envelope)


@pytest.mark.parametrize('sequence', [0, -1, 1.5, True, False])
def test_validate_rejects_invalid_sequence(sequence):
    envelope = make_valid_envelope()
    envelope['sequence'] = sequence

    with pytest.raises(ValueError, match='Invalid snapshot sequence'):
        KafkaStateChangelog._validate_envelope(envelope)


def test_validate_rejects_empty_snapshot_id():
    envelope = make_valid_envelope()
    envelope['snapshot_id'] = ''

    with pytest.raises(ValueError, match='Invalid snapshot ID'):
        KafkaStateChangelog._validate_envelope(envelope)


def test_validate_rejects_non_dictionary_state():
    envelope = make_valid_envelope()
    envelope['state'] = []

    with pytest.raises(ValueError, match='Snapshot state must be a dictionary'):
        KafkaStateChangelog._validate_envelope(envelope)


def test_validate_rejects_tampered_snapshot_checksum():
    envelope = make_valid_envelope()
    envelope['state']['streamforge:aggregator:seen_ids'].append('tampered-event')

    with pytest.raises(ValueError, match='Snapshot checksum mismatch'):
        KafkaStateChangelog._validate_envelope(envelope)


def test_validate_rejects_non_string_checksum():
    envelope = make_valid_envelope()
    envelope['checksum'] = 123

    with pytest.raises(ValueError, match='Invalid snapshot checksum'):
        KafkaStateChangelog._validate_envelope(envelope)
