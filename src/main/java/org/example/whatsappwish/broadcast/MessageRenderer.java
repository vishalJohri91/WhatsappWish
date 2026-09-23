package org.example.whatsappwish.broadcast;

import java.util.regex.Pattern;

/**
 * Replaces the name placeholder in a message template with a contact's intended name.
 *
 * <p>Supported placeholders (all case-insensitive):
 * {@code <Intended Name>}, {@code <name>}, {@code {name}}, {@code {{name}}}.
 * If the template has no placeholder, the name is appended after a space.
 */
public final class MessageRenderer {

    // Matches <intended name>, <name>, {name} and {{name}} in any case.
    private static final Pattern PLACEHOLDER = Pattern.compile(
            "<\\s*(?:intended\\s+)?name\\s*>|\\{\\{?\\s*name\\s*}?}",
            Pattern.CASE_INSENSITIVE);

    private MessageRenderer() {
    }

    public static String render(String template, String intendedName) {
        String name = intendedName == null ? "" : intendedName.trim();
        if (PLACEHOLDER.matcher(template).find()) {
            // Replace literally (no regex/group interpretation of the name).
            return PLACEHOLDER.matcher(template).replaceAll(java.util.regex.Matcher.quoteReplacement(name));
        }
        return name.isEmpty() ? template : template + " " + name;
    }
}
