// Ελληνικά (Greek) – PR #14 by TakissX
// Home Assistant uses the language code "el" for Greek; the card maps both "el" and "gr" to this file.
// Missing keys fall back to English automatically.
export default {
    editor: {
        title: "Τίτλος Κάρτας",
        main_sensors: "Κύριοι Αισθητήρες",
        soc: "SoC (Κατάσταση Φόρτισης %)",
        power: "Συνολική Ισχύς (Watt)",
        voltage: "Συνολική Τάση (Volt)",
        current: "Συνολικό Ρεύμα (Ampere)",
        drift: "Διαφορά Τάσης Στοιχείων Εξωτερικός Αισθητήρας (mV)",
        calc_drift: "Υπολογισμός Διαφοράς (Μέγιστη-Ελάχιστη) εσωτερικά",
        temp: "Θερμοκρασία Μπαταρίας",
        display_options: "Εμφάνιση & Επιλογές",
        min_voltage: "Ελάχιστη Τάση (V)",
        max_voltage: "Μέγιστη Τάση (V)",
        show_header_values: "Εμφάνιση Τιμών πάνω από τα Εικονίδια (Επικεφαλίδα)",
        hide_bars: "Απόκρυψη Ραβδογραμμάτων (Συμπαγής Λειτουργία)",
        horizontal_layout: "Οριζόντια Διάταξη (Προβολή Λίστας)",
        show_as_table: "Εμφάνιση ως Πίνακας (Χωρίς Ράβδους)",
        thick_borders: "Πιο Παχιά Περιγράμματα Ράβδων (2px)",
        enable_animations: "Ενεργοποίηση Κινούμενων Σχεδίων",
        show_cell_voltages: "Εμφάνιση Τάσεων Στοιχείων",
        show_min_max: "Επισήμανση Ελάχιστων/Μέγιστων Στοιχείων",
        show_average: "Εμφάνιση Μέσης Τάσης",
        cells: "Στοιχεία",
        add_cell: "Προσθήκη Στοιχείου",
        cell_name: "Όνομα",
        cell_entity: "Οντότητα Τάσης",
        cell_balance_entity: "Οντότητα Εξισορροπητή (προαιρ.)",
        cell_background_color: "Φόντο στοιχείου",
        cell_background_opacity: "Αδιαφάνεια φόντου",
        cell_bar_color: "Χρώμα ράβδου",
        cell_bar_opacity: "Αδιαφάνεια ράβδου",
        cell_bar_top_color: "Χρώμα κορυφής ράβδου (hex)",
        cell_bar_bottom_color: "Χρώμα βάσης ράβδου (hex)",

        // Επιλογές Λεπτομερούς Προβολής
        show_detailed_view: "Ενεργοποίηση Λεπτομερούς Προβολής",
        show_cell_list: "Εμφάνιση Λίστας Τάσεων Στοιχείων",
        show_standard_in_detail: "Εμφάνιση Τυπικής Προβολής (Ράβδοι) στο κάτω μέρος",
        show_charts: "Εμφάνιση Γραφημάτων",
        detailed_sensors: "Αισθητήρες Λεπτομερούς Προβολής (προαιρετικοί)",
        soh: "SoH (Υγεία %)",
        capacity: "Χωρητικότητα (Ah)",
        cycle_capacity: "Χωρητικότητα Κύκλου (Ah)",
        cycles: "Αριθμός Κύκλων",
        temp_mos: "Θερμοκρασία MOS",

        stat_charge: "Φόρτιση (Διακόπτης/Είσοδος Boolean/Επιλογή)",
        stat_discharge: "Εκφόρτιση (Διακόπτης/Είσοδος Boolean/Επιλογή)",
        stat_balance: "Καθολική Εξισορρόπηση (Διακόπτης/Είσοδος Boolean/Επιλογή)",

        // Προσαρμοσμένες Τιμές Κατάστασης
        val_on: "Τιμή για ON (π.χ. 'ON' ή 'True')",
        val_off: "Τιμή για OFF (π.χ. 'OFF' ή 'False')"
    },
    card: {
        default_title: "Στοιχεία Μπαταρίας",
        power: "Ισχύς",
        soc: "SoC",
        temp: "Θερμ.",
        delta: "Διαφορά",
        avg_cell: "Μέσο Στοιχείο",

        // Ετικέτες Λεπτομερούς Προβολής
        batt_voltage: "Τάση Μπαταρίας",
        delta_cell_vol: "Διαφορά Τάσης Στοιχείων",
        max_cell: "Μέγιστο Στοιχείο",
        min_cell: "Ελάχιστο Στοιχείο",
        charge: "Φόρτιση",
        discharge: "Εκφόρτιση",
        balance: "Εξισορρόπηση",
        on: "ΕΝΕΡΓΟ",
        off: "ΑΝΕΝΕΡΓΟ",
        soh: "SoH",
        batt_capacity: "Χωρητικότητα Μπαταρίας",
        cycle_capacity: "Χωρητικότητα Κύκλου",
        cycle_count: "Αριθμός Κύκλων",
        mos_temp: "Θερμ. MOS",
        min_temp: "Ελάχιστη Θερμ.",
        max_temp: "Μέγιστη Θερμ.",
        remain_capacity: "Υπολειπόμενη Χωρητικότητα"
    }
};
