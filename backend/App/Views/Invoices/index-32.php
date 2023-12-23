<?php

/************************************************* 
	E-Commerce System # Create Invoice File
	Built for TUNER B-NEXT Ltd. by Eden Ohana
	All Rights Reserved (C) eden@bnext.co.il
 **************************************************/

use DafCore\Application;

if (count($model['Details']) > 26)
    die("בשלב זה אין תמיכה בחשבוניות בנות יותר מעמוד אחד. נא להדפיס דרך קוד בינה. חשבונית מס` #{$invoiceNumber}.");


function convertImageToBase64($imageUrl) {
    $imageData = file_get_contents($imageUrl);
    $imageType = pathinfo($imageUrl, PATHINFO_EXTENSION);
    $base64Image = 'data:image/' . $imageType . ';base64,' . base64_encode($imageData);
    return $base64Image;
}

?>


<html dir="rtl">

<head>
    <title>חשבונית SHOPIPS - #<?= $invoiceNumber ?></title>
</head>

<body>
    <button type="button" onclick="window.print();">
        הדפס חשבונית
    </button>
    <div size="A4" id="card">

        <style>
            div[data-size="A4"] table,
            div[data-size="A4"] th,
            div[data-size="A4"] td {
                border: 0.4pt solid #818181;
                border-collapse: collapse;
            }

            div[data-size="A4"] th,
            div[data-size="A4"] td {
                padding-right: 2px;
            }

            div[data-size="A4"] {
                display: block;
                margin: 0 auto;
                width: 21cm;
                height: 29.7cm;
                position: relative;
                font-family: "David";
                line-height: 0.950684;
                font-style: normal;
                font-weight: normal;
                visibility: visible;
            }

            div[data-size="A4"][layout="portrait"] {
                width: 29.7cm;
                height: 21cm;
            }

            @media print {

                div[data-size="A4"] table,
                div[data-size="A4"] th,
                div[data-size="A4"] td {
                    border: 0.4pt solid #818181;
                }

                div[data-size="A4"] {
                    box-shadow: unset;
                }
            }
        </style>
        <img id="bg-img" src=<?= convertImageToBase64("public/assets/invoices/background-shoppis.jpg") ?> alt="" style="display:block; width:100%; height:100%;">
        <div style="top: 4.8cm; right: 7.2cm; position: absolute; width:250px; text-align: center; font-size: 26px;">חשבונית מס/קבלה</div>
        <div style="top: 5.75cm; right: 7.2cm; position: absolute; width:250px; text-align: center; font-size: 24px;">מקור</div>
        <div style="top: 4.85cm; left: 1.25cm;position: absolute;width: 220px;text-align: center;font-size: 19px;font-weight: 600;">מס' S01 - <?= sprintf("%06d", $invoiceNumber) . "/" . date("y") ?></div>
        <div style="top: 5.5cm;
				left: 3.9cm;
				position: absolute;
				width: 100px;
				text-align: right;
				font-size: 13px;
				line-height: 1.2;">תאריך<br />שעה<br />סוכן<br />דף מס`
        </div>
        <div style="top: 5.5cm;
    left: 2.6cm;
    position: absolute;
    width: 100px;
    text-align: right;
    font-size: 13px;
	line-height: 1.2;">: <?= date('d/m/y', time()) ?><br />: <?= date('H:i', time()) ?><br />: אתר<br />: 1</div>
        <div style="top: 7.7cm;
    left: 7.2cm;
    position: absolute;
    width: 100px;
    text-align: right;
    font-size: 13px;
	line-height: 1.2;">הזמנת רכש מס`</div>
        <div style="top: 7.7cm;
    left: 4.3cm;
    position: absolute;
    width: 100px;
    text-align: right;
    font-size: 13px;
	line-height: 1.2;">: <?= $model['Main']['SortingNumber'] ?></div>
        <div style="top: 5.3cm;
    right: 1cm;
    position: absolute;
    width: 100px;
    text-align: right;
    font-size: 13px;
	line-height: 1.2;">שם<br />כתובת<br />ישוב<br />מיקוד<br />טלפון<br />מ.עוסק/ח.פ</div>
        <div style="top: 5.3cm;
    right: 3cm;
    position: absolute;
    width: 150px;
    text-align: right;
    font-size: 13px;
	line-height: 1.2;">: <?= mb_substr($model['Main']['CustomerName'], 0, 20) ?>
            <br />: <?= mb_substr($model['Main']['CustomerStreet'], 0, 20) ?>
            <br />: <?= mb_substr($model['Main']['CustomerCity'], 0, 20) ?>
            <br />: <?= ($model['Main']['CustomerZipCode'] == '' ? '' : sprintf("%05d", $model['Main']['CustomerZipCode'])) ?>
            <br />: <?= $model['Main']['CustomerPhone'] ?>
            <br />: <?= (!empty($model['Main']['FreeTxt']) ? $model['Main']['FreeTxt'] : '') ?>
        </div>
        <div style="top: 7.8cm;
    right: 1cm;
    position: absolute;
    width: 100px;
    text-align: right;
    font-size: 13px;
	line-height: 1.2;">טלפון 2<br />סלולרי<br />דואר אלקטרוני<br />סוג אשראי</div>
        <div style="top: 7.8cm;
    right: 5cm;
    position: absolute;
    width: 150px;
    text-align: right;
    font-size: 13px;
	line-height: 1.2;">:
            <br />:
            <br />:
            <br />: רגיל
        </div>
        <table style="top: 9.6cm;
    right: 1cm;
    position: absolute;
    width: 700px;
    text-align: right;
    font-size: 13px;">
            <thead style="height: 20px;">
                <td style="width: 9%;">שירשור</td>
                <td style="width: 6%;">כמות</td>
                <td style="width: 8%; max-width: 25px;">מק`ט</td>
                <td style="width: 11%; max-width: 40px;">ברקוד</td>
                <td style="width: 45%; max-width: 300px;">תאור</td>
                <td style="width: 10.5%; max-width: 35px;">מחיר נטו</td>
                <td style="width: 10.5%; max-width: 35px;">סה`כ</td>
            </thead>
            <tbody>
                <?php
                $Total = 0;
                $Count = 0;
                foreach ($model['Details'] as $I => $Item) {
                    $Count = $Count + 1;
                    if ($Count > 26) break;
                ?>
                    <tr>
                        <td></td>
                        <td style="direction: ltr"><?= (!empty($Item['ItemNo']) ? number_format($Item['Amount'], 2, ".", ",") : '') ?></td>
                        <td><?= ($Item['ItemNo'] ?? "") ?></td>
                        <td><?= $Item['Barcode'] ?></td>
                        <td><?= mb_substr($Item['ItemName'], 0, 50) ?></td>
                        <td style="direction: ltr">
                            <?php
                            if (!empty($Item['PriceUnit']) && floatval($Item['PriceUnit']) != 0) {
                                if (floatval($Item['DiscountPercent']) > 0) {
                                    echo number_format($Item['PriceUnit'] - (($Item['PriceUnit'] / 100) * $Item['DiscountPercent']), 3, ".", ",");
                                } else {
                                    echo number_format($Item['PriceUnit'], 3, ".", ",");
                                }
                            } else {

                                echo '';
                            }
                            ?>
                        </td>
                        <td style="direction: ltr"><?php echo !empty($Item['Price']) && floatval($Item['Price']) != 0 ? number_format($Item['Price'], 3, ".", ",") : ''; ?></td>
                    </tr>
                <?php

                    if (isset($Item['ItemNo']) && isset($Item['Amount']))
                        $Total = $Total + $Item['Amount'];
                }
                ?>
            </tbody>
        </table>
        <div style="bottom: 6.9cm;
    right: 0.7cm;
    position: absolute;
    width: 150px;
    text-align: right;
    font-size: 16px;
	line-height: 1.2;">בוצע ע`י: SHOPIPS </div>
        <div style="bottom: 5cm;
    right: 0.7cm;
    position: absolute;
    width: 150px;
    text-align: right;
    font-size: 11.5px;
	line-height: 1.2;"><?= $model['Main']['Remark'] ?></div>
        <div style="bottom: 3.9cm;
    right: 0.7cm;
    position: absolute;
    width: 150px;
    text-align: right;
    font-size: 13.5px;
	line-height: 1.2;">סה`כ כמות: <?= number_format($Total, 2, ".", ",") ?></div>
        <div style="bottom: 6.65cm;
    right: 5.5cm;
    position: absolute;
    width: 150px;
    text-align: right;
    font-size: 11.5px;
	line-height: 1.2;"><b>מס` שיק</b><br />0</div>
        <div style="bottom: 6.65cm;
    right: 7.05cm;
    position: absolute;
    width: 150px;
    text-align: right;
    font-size: 11.5px;
	line-height: 1.2;"><b>תאריך</b><br /><?= date('d/m/y', time()) ?></div>
        <div style="bottom: 6.65cm;
    right: 8.2cm;
    position: absolute;
    width: 150px;
    text-align: right;
    font-size: 11.5px;
	line-height: 1.2;"><b>בנק/כ.אשראי</b><br />אתר SHOPIPS</div>
        <div style="bottom: 6.65cm;
    right: 11cm;
    position: absolute;
    width: 150px;
    text-align: right;
    font-size: 11.5px;
	line-height: 1.2;"><b>מ.חשבון/סוג</b><br />רגיל</div>
        <div style="bottom: 6.65cm;
    right: 13cm;
    position: absolute;
    width: 150px;
    text-align: right;
    font-size: 11.5px;
	line-height: 1.2;"><b>סכום</b><br /><?= number_format($model['Main']['Price'], 2, ".", ",") ?> ₪</div>
        <?php
        /* Prepare Page Footer */
        $BeforeVat = 0;
        $PrecentDiscount = 0;
        $PrecentBefore = 0;
        $AfterVat = 0;
        $Vat = 0;

        /* Check for Discount Mismistach */
        $Check = floatval($model['Main']['Price'] / 1.17);
        foreach ($model['Details'] as $I => $Item) {
            if (isset($Item['ItemNo']) && isset($Item['Price']))
                $Check = $Check - $Item['Price'];
        }
        $Check = floatval(number_format($Check * -1, 2, ".", ","));
        if ($Check == 0) {
            $BeforeVat = number_format(round(floatval($model['Main']['PriceBeforeVat']), 9), 2, ".", ",");
            $AfterVat = number_format($model['Main']['Price'], 2, ".", ",");
            $PrecentDiscount = '0.00';
            $PrecentBefore = '0.00';
            $Vat = round(floatval(round(str_replace(',', '', $AfterVat), 9)) - floatval(str_replace(',', '', round(str_replace(',', '', $BeforeVat), 9))), 9);
        } else {
            $BeforeVat = number_format(round(floatval($model['Main']['PriceBeforeVat']), 9), 2, ".", ",");
            $PrecentDiscount = number_format((($Check / number_format(round(floatval($model['Main']['PriceBeforeVat']), 9), 2, ".", ",")) * 100), 2, ".", ",");
            $PrecentBefore = $Check;
            $Vat = number_format(round(floatval($model['Main']['Price'] - floatval(number_format(round(floatval($model['Main']['PriceBeforeVat']), 9), 2, ".", ","))) + $Check, 9), 2, ".", ",");
            $AfterVat = number_format($model['Main']['Price'], 2, ".", ",");
        }
        ?>
        <div style="bottom: 4.38cm;
    left: 2.7cm;
    position: absolute;
    width: 150px;
    text-align: right;
    font-size: 15.5px;
	line-height: 1.2; font-weight: bold;">סה`כ חייב מע`מ<br />סה`כ פטור מע`מ<br />הנחה <?= $PrecentDiscount ?>%<br />מע`מ 17.00%<br />לתשלום בש`ח<br /><span style="margin-top: 3px; display: block;">חתימה:</span></div>
        <div style="bottom: 4.4cm;
    left: 1cm;
    position: absolute;
    width: 100px;
    text-align: right;
    font-size: 15.5px;
	line-height: 1.2; font-weight: bold;">
            <?= $BeforeVat ?>
            <br />0.00
            <br /><?= $PrecentBefore ?>
            <br /><?= $Vat ?>
            <br /><?= $AfterVat ?>
            <br />
            <br />
            <span style="width: 100px !important;
    height: 1px;
    border-top: 1px solid #000;
    display: block;"></span>
        </div>
        <div style="bottom: 3.45cm;
    right: 0.7cm;
    position: absolute;
    width: 170px;
    text-align: right;
    font-size: 14.5px;
	line-height: 1.2;">הופק ע`י: טונר בי נקסט בע`מ</div>
        <div style="bottom: 3.45cm;
    left: -0.2cm;
    position: absolute;
    width: 270px;
    text-align: right;
    font-size: 14.5px;
	line-height: 1.2;">באמצעות תוכנת `קוד בינה` 1-700-500-205</div>
        <div style="bottom: 5.6cm;
    left: 6.2cm;
    position: absolute;
    width: 170px;
    text-align: right;
    font-size: 12.7px;
	font-weight: bold;
	line-height: 1.2;">סה`כ שיקים:<br />סה`כ מזומן:</div>
        <div style="bottom: 5.6cm;
    left: 3.5cm;
    position: absolute;
    width: 170px;
    text-align: right;
    font-size: 12.5px;
	font-weight: bold;
	line-height: 1.2;">0.00<br />0.00</div>
    </div>
    <style>
        @font-face {
            font-family: 'David';
            src: url('/public/assets/David.ttf') format('truetype');
            font-weight: normal;
        }

        @font-face {
            font-family: 'David';
            src: url('/public/assets/DavidBold.ttf') format('truetype');
            font-weight: bold;
        }

        button {
            font-size: 20px;
            display: block;
            width: auto;
            margin: 20px auto;
            background: #63b163;
            color: white;
            border: unset;
            border-radius: 5px;
            padding: 20px;
            box-shadow: 0 8px 8px 0 rgb(0 0 0 / 50%);
        }

        button:hover {
            cursor: pointer;
            background: #9ec89e;
        }

        body {
            background: rgb(204, 204, 204);
            font-family: 'David';
            line-height: 0.950684;
            font-style: normal;
            font-weight: normal;
            visibility: visible;
        }

        table,
        th,
        td {
            border: 0.4pt solid #818181;
            border-collapse: collapse;
        }

        th,
        td {
            padding-right: 2px;
        }

        div[size="A4"] {
            display: block;
            margin: 0 auto;
            width: 21cm;
            height: 29.7cm;
            position: relative;
            box-shadow: 0 10px 16px 0 rgb(0 0 0 / 50%);
        }

        div[size="A4"].printNow {
            box-shadow: unset;
        }

        div[size="A4"][layout="portrait"] {
            width: 29.7cm;
            height: 21cm;
        }

        @media print {
            button {
                display: none;
            }

            body,
            page {
                margin: 0;
                box-shadow: 0;
                background: unset;
            }

            table,
            th,
            td {
                border: 0.4pt solid #818181;
            }

            div[size="A4"] {
                box-shadow: unset;
            }
        }
    </style>
</body>

</html>
<?php
?>