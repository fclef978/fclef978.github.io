/*
 単位計算するやつ
 */

$(function () {
    var data = JSON.parse($('#json').text());
    var tabGe = $('table#general-table tbody');
    var tabSp = $('table#special-table tbody');

    generateRow(data['general'], tabGe);
    generateRow(data['special'], tabSp);
});

function generateRow(data, parent) {
    var rowTamplate = $('table#template tbody tr');
    $.each(data, function (id, subject) {
        var tr = rowTamplate.clone().appendTo(parent);
        tr.children(':eq(0)').text(subject.grade);
        tr.children(':eq(1)').text(subject.name);
        tr.children(':eq(2)').text(subject.number);
        var checkbox = tr.find('input[type=checkbox]');
        checkbox.attr('value', subject.number);
        if (subject.taken) checkbox.prop('checked', true);
    });
}

$(function () {
    update();
    $('input[type="checkbox"]').change(function () {
        update();
    });
});

function update() {
    var general = $('#general-total');
    var special = $('#special-total');
    var total = $('#grand-total');
    var geInputs = $('table#general-table input[type=checkbox]');
    var spInputs = $('table#special-table input[type=checkbox]');
    var geTotal = 0;
    var spTotal = 0;
    var grandTotal = 0;

    geTotal = calcTotal(geInputs, '#generalEx', general);
    judge(general, geTotal, 75);
    spTotal = calcTotal(spInputs, '#specialEx', special);
    judge(special.parent(), spTotal, 82);

    grandTotal = geTotal+spTotal;
    total.text(grandTotal);
    judge(total, grandTotal, 167);
}

function calcTotal(inputs, selector, totalWrapper) {
    var total = 0;
    inputs.each(function () {
        if ($(this).prop('checked')) total += parseInt($(this).val());
    });
    var ex = parseInt($(selector).val());
    if (ex) total += ex;
    totalWrapper.text(total);
    return total;
}

function judge(cell, val, border) {
    if (val >= border) cell.css("background-color", "#00bb00");
    else cell.css("background-color", "#bb0000");
}
