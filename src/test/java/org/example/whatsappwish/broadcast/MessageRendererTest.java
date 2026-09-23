package org.example.whatsappwish.broadcast;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MessageRendererTest {

    @Test
    void replacesIntendedNamePlaceholder() {
        assertThat(MessageRenderer.render("Happy Diwali <Intended Name>", "Mummy"))
                .isEqualTo("Happy Diwali Mummy");
    }

    @Test
    void placeholderIsCaseInsensitive() {
        assertThat(MessageRenderer.render("Hi <intended name>!", "Papa"))
                .isEqualTo("Hi Papa!");
    }

    @Test
    void supportsCurlyBracePlaceholders() {
        assertThat(MessageRenderer.render("Hello {name} and {{name}}", "Bhaiya"))
                .isEqualTo("Hello Bhaiya and Bhaiya");
    }

    @Test
    void appendsNameWhenNoPlaceholderPresent() {
        assertThat(MessageRenderer.render("Happy New Year", "Mummy"))
                .isEqualTo("Happy New Year Mummy");
    }

    @Test
    void nameWithSpecialCharsIsNotInterpretedAsRegex() {
        assertThat(MessageRenderer.render("Hi <name>", "$100 & you"))
                .isEqualTo("Hi $100 & you");
    }

    @Test
    void handlesNullIntendedNameGracefully() {
        assertThat(MessageRenderer.render("Hi <name>", null))
                .isEqualTo("Hi ");
    }
}
