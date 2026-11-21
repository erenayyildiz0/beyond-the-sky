from conftest import needs_raw


@needs_raw
def test_birth_table(model):
    b = model.sky["birth"]
    years = [r[0] for r in b["rows"]]
    assert years == list(range(1900, 2027))
    cover = sum(1 for y, _, d in b["rows"] if 1946 <= y <= 2018 and abs(d) <= 1)
    assert cover >= 70
    row2007 = next(r for r in b["rows"] if r[0] == 2007)
    assert model.df.hip[row2007[1]] == 3821                    # Achird
    assert all(model.df.dec[r[1]] > -45.08 for r in b["rows"])
