import React from 'react'
import { Box, Text, Container, Group, Divider } from '@mantine/core'
import { IconHeart } from '@tabler/icons-react'

export function Footer() {
  return (
    <Box
      component="footer"
      mt="xl"
      py="lg"
      style={{
        borderTop: '1px solid #e0e0e0',
        marginTop: 'auto'
      }}
    >
      <Container size="xl">
        <Group justify="center" gap="xs">
          <Text size="sm" c="dimmed">
            Powered by
          </Text>
          <Text size="sm" fw={600} c="blue.6">
            Qualia Solutions
          </Text>
          <IconHeart size={16} color="#e74c3c" />
        </Group>
        <Text ta="center" size="xs" c="dimmed" mt="xs">
          © 2025 Qualia Solutions. All rights reserved.
        </Text>
      </Container>
    </Box>
  )
}